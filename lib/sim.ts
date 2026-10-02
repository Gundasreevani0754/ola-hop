import { getRoute, type Route } from "./network";
import { Rng } from "./rng";
import type { Filter, Metrics, SimEvent, SimEventKind, Vehicle, VehicleType, World } from "./types";

export const TYPES: Record<VehicleType, { label: string; fare: number; capacity: number }> = {
  auto: { label: "Auto", fare: 50, capacity: 3 },
  car: { label: "Cab", fare: 80, capacity: 4 },
  bus: { label: "Bus", fare: 25, capacity: 40 },
};

/**
 * Fixed fare per seat, by ride length. The PRD sets ₹25, ₹50 and ₹80 for 8 to 12 km;
 * the shorter and longer bands are my estimates for the wider network.
 */
export function fareFor(type: VehicleType, km: number): number {
  const base = TYPES[type].fare;
  if (km <= 5) return Math.round((base * 0.6) / 5) * 5;
  if (km <= 12) return base;
  return Math.round((base * 1.4) / 5) * 5;
}

/** About 17 km/h. TomTom 2025 puts Bengaluru at 36 min per 10 km. */
export const CRUISE_KM_PER_MIN = 0.28;
export const DWELL_MIN = 0.4;
export const HEADWAY_MIN = { day: 4, night: 8 };
/** 1 real second is 6 simulated seconds. */
export const SIM_MIN_PER_REAL_SEC = 0.1;
export const DAY_START = 8 * 60 + 24;
export const NIGHT_START = 21 * 60 + 40;
const DAY_SERVICE_START = 6 * 60;
const NIGHT_SERVICE_START = 20 * 60;
export const SEED = 20351004;
/** New vehicles leave a depot this far before the first stop, so riders there see them coming. */
const DEPOT_KM = -1.2;

const MEN = ["Ramesh K", "Imran S", "Venkatesh R", "Suresh B", "Anil D", "Joseph T", "Manjunath H", "Ravi P", "Prakash N", "Mohammed A", "Srinivas R", "Kiran B"];
// Lakshmi is kept for the lead auto, since the story follows her.
export const LEAD_DRIVER = "Lakshmi N";
const WOMEN = ["Kavya P", "Shabana R", "Meena D", "Asha M", "Priyanka S", "Fatima B", "Revathi K", "Deepa R", "Nandini V", "Sowmya L", "Zainab H", "Rukmini T"];
const WAIT_HISTORY = 400;

export const headwayMin = (night: boolean) => (night ? HEADWAY_MIN.night : HEADWAY_MIN.day);
export const headwayKm = (night: boolean) => headwayMin(night) * CRUISE_KM_PER_MIN;

// Riders turning up per simulated minute at each stop, and the chance each seated
// rider gets off there. Busiest at the first stop, everyone off at the last.
const arrivalsPerMin = (route: Route, i: number) =>
  i === route.stops.length - 1 ? 0 : i === 0 ? 0.45 : 0.28;
function alightProb(route: Route, i: number): number {
  const last = route.stops.length - 1;
  if (i === 0) return 0;
  if (i === last) return 1;
  return 0.1 + 0.25 * (i / last);
}

function plate(rng: Rng, type: VehicleType, route: Route): string {
  if (type === "bus") return route.busRef;
  return `${type === "auto" ? "KA 05 AH" : "KA 03 MJ"} ${rng.int(1000, 9999)}`;
}

function lastStopAt(route: Route, km: number): number {
  let last = -1;
  route.stops.forEach((s, i) => {
    if (s.km <= km) last = i;
  });
  return last;
}

/** Pick a driver nobody else on the line has right now. */
function pickName(rng: Rng, pool: string[], onLine: Vehicle[]): string {
  const used = new Set(onLine.map((v) => v.driverName));
  const free = pool.filter((n) => !used.has(n));
  return rng.pick(free.length ? free : pool);
}

function makeVehicle(
  rng: Rng,
  route: Route,
  id: number,
  posKm: number,
  night: boolean,
  onLine: Vehicle[],
  standby = false,
): Vehicle {
  // MVP fleet: about 40 autos and cabs (12 with women drivers) plus 5 partner buses.
  // No buses on Night Line, and only women drivers.
  const type: VehicleType = night
    ? rng.pick(["auto", "auto", "car"] as const)
    : rng.pick(["auto", "auto", "auto", "car", "car", "bus"] as const);
  const woman = night || (type !== "bus" && rng.chance(0.3));
  const capacity = TYPES[type].capacity;
  const seats = type === "bus" ? rng.int(6, 25) : rng.int(1, capacity - 1);
  return {
    id,
    type,
    posKm,
    seats,
    capacity,
    woman,
    driverName: type === "bus" ? "BMTC partner" : pickName(rng, woman ? WOMEN : MEN, onLine),
    plate: plate(rng, type, route),
    status: standby ? "standby" : "approaching",
    lastStop: lastStopAt(route, posKm),
    dwellLeft: 0,
    holdLeft: 0,
    traffic: rng.range(0.9, 1.1),
    standby,
  };
}

function pushEvent(w: World, kind: SimEventKind, text: string, vehicleId?: number) {
  const e: SimEvent = { id: w.nextEventId++, t: w.t, kind, text, vehicleId };
  w.events = [...w.events.slice(-39), e];
}

function emptyMetrics(): Metrics {
  return {
    rides: 0,
    ridesWait5: 0,
    recentWaits: [],
    fares: { auto: 0, car: 0, bus: 0 },
    vehicleMinutes: { auto: 0, car: 0, bus: 0 },
  };
}

/**
 * A fresh route at 8:24 am (or 9:40 pm for Night Line). The counters are warmed
 * up by running the same simulation from 6 am (or 8 pm), so the numbers on
 * screen come from the model rather than being typed in.
 */
export function createWorld(night: boolean, routeKey = "L3", riderStop = 2, seed = SEED): World {
  const start = night ? NIGHT_START : DAY_START;
  let warm = buildWorld(night, routeKey, riderStop, seed + 7, night ? NIGHT_SERVICE_START : DAY_SERVICE_START);
  while (warm.t < start - 1e-9) warm = step(warm, Math.min(0.1, start - warm.t));
  const w = buildWorld(night, routeKey, riderStop, seed, start);
  return { ...w, metrics: warm.metrics, events: warm.events, nextEventId: warm.nextEventId };
}

function buildWorld(night: boolean, routeKey: string, riderStop: number, seed: number, t: number): World {
  const route = getRoute(routeKey);
  const rng = new Rng(night ? seed + 1 : seed);
  const gap = headwayKm(night);
  const riderKm = route.stops[riderStop].km;
  const vehicles: Vehicle[] = [];
  let nextId = 1;

  // Space the fleet one headway apart, with the first vehicle about a minute from the
  // rider's stop. At the first stop of a route it is still on its way from the depot.
  const firstKm = riderKm - 0.3;
  for (let km = firstKm; km < route.length - 0.2; km += gap) {
    vehicles.push(makeVehicle(rng, route, nextId++, km, night, vehicles));
  }
  for (let km = firstKm - gap; km >= DEPOT_KM; km -= gap) {
    vehicles.push(makeVehicle(rng, route, nextId++, km, night, vehicles));
  }

  // The vehicle about to reach the rider is Lakshmi's auto, as in the PRD.
  Object.assign(vehicles[0], {
    type: "auto",
    capacity: TYPES.auto.capacity,
    seats: 1,
    woman: true,
    driverName: LEAD_DRIVER,
    plate: plate(rng, "auto", route),
  });

  const last = route.stops.length - 1;
  const minKm = Math.min(...vehicles.map((v) => v.posKm));
  const queues = route.stops.map((_, i) =>
    Array.from({ length: i < last ? rng.int(0, 2) : 0 }, () => t - rng.range(0, 3)),
  );
  return {
    routeKey,
    riderStop,
    night,
    t,
    rngState: rng.state,
    vehicles,
    nextId,
    sinceSpawn: (minKm - DEPOT_KM) / CRUISE_KM_PER_MIN,
    standbyCooldown: 0,
    queues,
    metrics: emptyMetrics(),
    events: [],
    nextEventId: 1,
  };
}

/** Simulated minutes until `v` reaches stop `stopIdx`: 0 if it is there now, null if it has passed. */
export function etaMin(route: Route, v: Vehicle, stopIdx: number): number | null {
  const atStop = v.lastStop === stopIdx && (v.dwellLeft > 0 || v.holdLeft > 0);
  if (atStop) return 0;
  if (v.lastStop >= stopIdx) return null;
  const stopsBetween = Math.max(0, stopIdx - v.lastStop - 1);
  return (
    (route.stops[stopIdx].km - v.posKm) / CRUISE_KM_PER_MIN +
    v.dwellLeft +
    v.holdLeft +
    stopsBetween * DWELL_MIN
  );
}

/** Vehicles still to reach `stopIdx`, nearest first. */
export function upcoming(w: World, stopIdx: number, filter: Filter = "all") {
  const route = getRoute(w.routeKey);
  return w.vehicles
    .map((v) => ({ v, eta: etaMin(route, v, stopIdx) }))
    .filter(
      (x): x is { v: Vehicle; eta: number } =>
        x.eta !== null &&
        (filter === "all" || x.v.type === filter) &&
        (!w.night || x.v.woman),
    )
    .sort((a, b) => a.eta - b.eta);
}

/** Whole minutes for display, never below 1 unless the vehicle is at the stop. */
export const displayMin = (eta: number) => (eta <= 0 ? 0 : Math.max(1, Math.round(eta)));

export function formatClock(t: number): string {
  const mins = Math.floor(((t % 1440) + 1440) % 1440);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h24 < 12 ? "am" : "pm"}`;
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function serveStop(w: World, route: Route, v: Vehicle, stopIdx: number, rng: Rng) {
  v.lastStop = stopIdx;
  v.posKm = route.stops[stopIdx].km;
  v.dwellLeft = DWELL_MIN;

  const seated = v.capacity - v.seats;
  let off = 0;
  for (let i = 0; i < seated; i++) if (rng.chance(alightProb(route, stopIdx))) off++;
  v.seats += off;

  if (stopIdx === route.stops.length - 1) return;

  const queue = w.queues[stopIdx];
  const boarding = Math.min(v.seats, queue.length);
  const boarded = queue.splice(0, boarding);
  v.seats -= boarding;
  for (const arrivedAt of boarded) {
    const wait = w.t - arrivedAt;
    w.metrics.rides++;
    if (wait <= 5) w.metrics.ridesWait5++;
    w.metrics.recentWaits.push(wait);
    w.metrics.fares[v.type] += TYPES[v.type].fare;
  }
  if (w.metrics.recentWaits.length > WAIT_HISTORY) {
    w.metrics.recentWaits.splice(0, w.metrics.recentWaits.length - WAIT_HISTORY);
  }

  // Even gaps: if this vehicle has caught up with the one ahead, hold it back.
  const gap = headwayKm(w.night);
  const ahead = w.vehicles
    .filter((o) => o.id !== v.id && o.posKm > v.posKm)
    .sort((a, b) => a.posKm - b.posKm)[0];
  if (ahead && ahead.posKm - v.posKm < gap * 0.4) {
    v.holdLeft = Math.min(1, (gap * 0.75 - (ahead.posKm - v.posKm)) / CRUISE_KM_PER_MIN);
    pushEvent(w, "hold", `${TYPES[v.type].label} ${v.plate} held ${Math.round(v.holdLeft * 60)} s at ${route.stops[stopIdx].name} to keep gaps even`, v.id);
  }
}

function sendStandbyIfGap(w: World, route: Route, rng: Rng) {
  if (w.standbyCooldown > 0) return;
  const gap = headwayKm(w.night);
  const last = route.stops.length - 1;
  const sorted = [...w.vehicles].sort((a, b) => b.posKm - a.posKm);
  for (let i = 0; i < sorted.length - 1; i++) {
    const front = sorted[i];
    const rear = sorted[i + 1];
    if (front.posKm - rear.posKm <= gap * 2) continue;
    // Send a standby vehicle from the stop inside the gap that is closest behind the front vehicle.
    const stopIdx = route.stops.findLastIndex(
      (s, idx) => idx < last && s.km > rear.posKm + 0.3 && s.km < front.posKm - 0.3,
    );
    if (stopIdx < 0) continue;
    const v = makeVehicle(rng, route, w.nextId++, route.stops[stopIdx].km - 0.001, w.night, w.vehicles, true);
    v.lastStop = stopIdx - 1;
    v.seats = v.capacity - (v.type === "bus" ? 10 : 0);
    w.vehicles.push(v);
    w.standbyCooldown = headwayMin(w.night);
    pushEvent(w, "standby", `Gap over two intervals before ${route.stops[stopIdx].name}. Standby ${TYPES[v.type].label.toLowerCase()} sent.`, v.id);
    return;
  }
}

/** Advance the world by `dt` simulated minutes. Returns a new World. */
export function step(prev: World, dt: number): World {
  const route = getRoute(prev.routeKey);
  const last = route.stops.length - 1;
  const rng = new Rng(prev.rngState);
  const w: World = {
    ...prev,
    t: prev.t + dt,
    vehicles: prev.vehicles.map((v) => ({ ...v })),
    queues: prev.queues.map((q) => [...q]),
    metrics: {
      ...prev.metrics,
      recentWaits: [...prev.metrics.recentWaits],
      fares: { ...prev.metrics.fares },
      vehicleMinutes: { ...prev.metrics.vehicleMinutes },
    },
    events: prev.events,
  };
  const rate = w.night ? 0.2 : 1;

  // Riders turning up at stops.
  w.queues.forEach((q, i) => {
    if (rng.chance(arrivalsPerMin(route, i) * rate * dt)) q.push(w.t);
  });

  for (const v of w.vehicles) {
    v.traffic = Math.min(1.2, Math.max(0.75, v.traffic + rng.range(-0.15, 0.15) * dt));
    w.metrics.vehicleMinutes[v.type] += dt;
    if (v.dwellLeft > 0 || v.holdLeft > 0) {
      if (v.dwellLeft > 0) v.dwellLeft = Math.max(0, v.dwellLeft - dt);
      else v.holdLeft = Math.max(0, v.holdLeft - dt);
      v.status = "atStop";
      continue;
    }

    v.posKm += CRUISE_KM_PER_MIN * v.traffic * dt;
    const next = v.lastStop + 1;
    if (next <= last && v.posKm >= route.stops[next].km) serveStop(w, route, v, next, rng);

    if (v.dwellLeft > 0) v.status = "atStop";
    else if (v.seats === 0) v.status = "full";
    else v.status = v.standby ? "standby" : "approaching";
  }

  // Remove vehicles that finished at the last stop.
  w.vehicles = w.vehicles.filter((v) => !(v.lastStop === last && v.dwellLeft <= 0));

  // Regular departures from the depot, one headway apart.
  w.sinceSpawn += dt;
  if (w.sinceSpawn >= headwayMin(w.night)) {
    w.sinceSpawn = 0;
    const v = makeVehicle(rng, route, w.nextId++, DEPOT_KM, w.night, w.vehicles);
    v.lastStop = -1;
    v.seats = v.capacity; // leaves the depot empty
    w.vehicles.push(v);
  }

  w.standbyCooldown = Math.max(0, w.standbyCooldown - dt);
  sendStandbyIfGap(w, route, rng);

  w.rngState = rng.state;
  return w;
}
