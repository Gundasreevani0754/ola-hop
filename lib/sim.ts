import { LAST_STOP, LINE, LINE_LENGTH_KM, STOPS } from "./line";
import { Rng } from "./rng";
import type { Filter, SimEvent, SimEventKind, Vehicle, VehicleType, World } from "./types";

export const TYPES: Record<VehicleType, { label: string; fare: number; capacity: number }> = {
  auto: { label: "Auto", fare: 50, capacity: 3 },
  car: { label: "Cab", fare: 80, capacity: 4 },
  bus: { label: "Bus", fare: 25, capacity: 40 },
};

/** About 17 km/h. TomTom 2025 puts Bengaluru at 36 min per 10 km. */
export const CRUISE_KM_PER_MIN = 0.28;
export const DWELL_MIN = 0.4;
export const HEADWAY_MIN = { day: 4, night: 8 };
/** 1 real second is 6 simulated seconds. */
export const SIM_MIN_PER_REAL_SEC = 0.1;
export const DAY_START = 8 * 60 + 24;
export const NIGHT_START = 21 * 60 + 40;
export const SEED = 20351004;

// Riders turning up per simulated minute at each stop, and the chance each
// seated rider gets off there. Tuned so a 4-minute line mostly keeps waits low.
const ARRIVALS_PER_MIN = [0.45, 0.25, 0.3, 0.3, 0.15, 0];
const ALIGHT_PROB = [0, 0.1, 0.1, 0.35, 0.3, 1];

const MEN = ["Ramesh K", "Imran S", "Venkatesh R", "Suresh B", "Anil D", "Joseph T", "Manjunath H", "Ravi P", "Prakash N", "Mohammed A", "Srinivas R", "Kiran B"];
// Lakshmi is kept for the lead auto, since the driver app follows her.
export const LEAD_DRIVER = "Lakshmi N";
const WOMEN = ["Kavya P", "Shabana R", "Meena D", "Asha M", "Priyanka S", "Fatima B", "Revathi K", "Deepa R", "Nandini V", "Sowmya L", "Zainab H", "Rukmini T"];
const WAIT_HISTORY = 400;

export const headwayMin = (night: boolean) => (night ? HEADWAY_MIN.night : HEADWAY_MIN.day);
export const headwayKm = (night: boolean) => headwayMin(night) * CRUISE_KM_PER_MIN;

function plate(rng: Rng, type: VehicleType): string {
  if (type === "bus") return "Partner bus 500-D";
  return `${type === "auto" ? "KA 05 AH" : "KA 03 MJ"} ${rng.int(1000, 9999)}`;
}

function lastStopAt(km: number): number {
  let last = -1;
  STOPS.forEach((s, i) => {
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
    plate: plate(rng, type),
    status: standby ? "standby" : "approaching",
    lastStop: lastStopAt(posKm),
    dwellLeft: 0,
    holdLeft: 0,
    delayLeft: 0,
    traffic: rng.range(0.9, 1.1),
    standby,
  };
}

function pushEvent(w: World, kind: SimEventKind, text: string, vehicleId?: number) {
  const e: SimEvent = { id: w.nextEventId++, t: w.t, kind, text, vehicleId };
  w.events = [...w.events.slice(-39), e];
}

export function createWorld(night: boolean, seed = SEED): World {
  const rng = new Rng(night ? seed + 1 : seed);
  const gap = headwayKm(night);
  const riderKm = STOPS[LINE.riderStop].km;
  const vehicles: Vehicle[] = [];
  let nextId = 1;

  // Space the fleet one headway apart, with the first vehicle about a minute from Agara.
  const firstKm = riderKm - 0.3;
  for (let km = firstKm; km < LINE_LENGTH_KM - 0.2; km += gap) {
    vehicles.push(makeVehicle(rng, nextId++, km, night, vehicles));
  }
  for (let km = firstKm - gap; km >= 0; km -= gap) {
    vehicles.push(makeVehicle(rng, nextId++, km, night, vehicles));
  }

  // The vehicle about to reach the rider is Lakshmi's auto, as in the PRD.
  const lead = vehicles[0];
  Object.assign(lead, {
    type: "auto",
    capacity: TYPES.auto.capacity,
    seats: 1,
    woman: true,
    driverName: LEAD_DRIVER,
    plate: plate(rng, "auto"),
  });

  const minKm = Math.min(...vehicles.map((v) => v.posKm));
  const queues = STOPS.map((_, i) =>
    Array.from({ length: rng.int(0, 2) * (i < LAST_STOP ? 1 : 0) }, () => -rng.range(0, 3)),
  );
  const t = night ? NIGHT_START : DAY_START;

  return {
    night,
    t,
    rngState: rng.state,
    vehicles,
    nextId,
    sinceSpawn: minKm / CRUISE_KM_PER_MIN,
    standbyCooldown: 0,
    queues: queues.map((q) => q.map((ago) => t + ago)),
    metrics: { rides: 0, ridesWait5: 0, recentWaits: [], waitsByStop: STOPS.map(() => []) },
    events: [],
    nextEventId: 1,
  };
}

/** Simulated minutes until `v` reaches stop `stopIdx`: 0 if it is there now, null if it has passed. */
export function etaMin(v: Vehicle, stopIdx: number): number | null {
  const atStop = v.lastStop === stopIdx && (v.dwellLeft > 0 || v.holdLeft > 0);
  if (atStop) return 0;
  if (v.lastStop >= stopIdx) return null;
  const stopsBetween = Math.max(0, stopIdx - v.lastStop - 1);
  return (
    (STOPS[stopIdx].km - v.posKm) / CRUISE_KM_PER_MIN +
    v.dwellLeft +
    v.holdLeft +
    v.delayLeft +
    stopsBetween * DWELL_MIN
  );
}

/** Vehicles still to reach `stopIdx`, nearest first. */
export function upcoming(w: World, stopIdx: number, filter: Filter = "all") {
  return w.vehicles
    .map((v) => ({ v, eta: etaMin(v, stopIdx) }))
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

function serveStop(w: World, v: Vehicle, stopIdx: number, rng: Rng) {
  v.lastStop = stopIdx;
  v.posKm = STOPS[stopIdx].km;
  v.dwellLeft = DWELL_MIN;

  const seated = v.capacity - v.seats;
  let off = 0;
  for (let i = 0; i < seated; i++) if (rng.chance(ALIGHT_PROB[stopIdx])) off++;
  v.seats += off;

  if (stopIdx === LAST_STOP) return;

  const queue = w.queues[stopIdx];
  const boarding = Math.min(v.seats, queue.length);
  const boarded = queue.splice(0, boarding);
  v.seats -= boarding;
  for (const arrivedAt of boarded) {
    const wait = w.t - arrivedAt;
    w.metrics.rides++;
    if (wait <= 5) w.metrics.ridesWait5++;
    w.metrics.recentWaits.push(wait);
    w.metrics.waitsByStop[stopIdx].push(wait);
    if (w.metrics.waitsByStop[stopIdx].length > WAIT_HISTORY / 4) w.metrics.waitsByStop[stopIdx].shift();
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
    pushEvent(w, "hold", `${TYPES[v.type].label} ${v.plate} held ${Math.round(v.holdLeft * 60)} s at ${STOPS[stopIdx].name} to keep gaps even`, v.id);
  }
}

function sendStandbyIfGap(w: World, rng: Rng) {
  if (w.standbyCooldown > 0) return;
  const gap = headwayKm(w.night);
  const sorted = [...w.vehicles].sort((a, b) => b.posKm - a.posKm);
  for (let i = 0; i < sorted.length - 1; i++) {
    const front = sorted[i];
    const rear = sorted[i + 1];
    if (front.posKm - rear.posKm <= gap * 2) continue;
    // Send a standby vehicle from the stop inside the gap that is closest behind the front vehicle.
    const stopIdx = STOPS.findLastIndex(
      (s, idx) => idx < LAST_STOP && s.km > rear.posKm + 0.3 && s.km < front.posKm - 0.3,
    );
    if (stopIdx < 0) continue;
    const v = makeVehicle(rng, w.nextId++, STOPS[stopIdx].km - 0.001, w.night, w.vehicles, true);
    v.lastStop = stopIdx - 1;
    v.seats = v.capacity - (v.type === "bus" ? 10 : 0);
    w.vehicles.push(v);
    w.standbyCooldown = headwayMin(w.night);
    pushEvent(w, "standby", `Gap over two intervals before ${STOPS[stopIdx].name}. Standby ${TYPES[v.type].label.toLowerCase()} sent.`, v.id);
    return;
  }
}

/** Advance the world by `dt` simulated minutes. Returns a new World. */
export function step(prev: World, dt: number): World {
  const rng = new Rng(prev.rngState);
  const w: World = {
    ...prev,
    t: prev.t + dt,
    vehicles: prev.vehicles.map((v) => ({ ...v })),
    queues: prev.queues.map((q) => [...q]),
    metrics: {
      ...prev.metrics,
      recentWaits: [...prev.metrics.recentWaits],
      waitsByStop: prev.metrics.waitsByStop.map((q) => [...q]),
    },
    events: prev.events,
  };
  const rate = w.night ? 0.2 : 1;

  // Riders turning up at stops.
  w.queues.forEach((q, i) => {
    if (rng.chance(ARRIVALS_PER_MIN[i] * rate * dt)) q.push(w.t);
  });

  for (const v of w.vehicles) {
    v.traffic = Math.min(1.2, Math.max(0.75, v.traffic + rng.range(-0.15, 0.15) * dt));

    if (v.delayLeft > 0) {
      v.delayLeft = Math.max(0, v.delayLeft - dt);
      v.status = "delayed";
      continue;
    }
    if (v.dwellLeft > 0 || v.holdLeft > 0) {
      if (v.dwellLeft > 0) v.dwellLeft = Math.max(0, v.dwellLeft - dt);
      else v.holdLeft = Math.max(0, v.holdLeft - dt);
      v.status = "atStop";
      continue;
    }

    v.posKm += CRUISE_KM_PER_MIN * v.traffic * dt;
    const next = v.lastStop + 1;
    if (next <= LAST_STOP && v.posKm >= STOPS[next].km) serveStop(w, v, next, rng);

    if (v.dwellLeft > 0) v.status = "atStop";
    else if (v.seats === 0) v.status = "full";
    else v.status = v.standby ? "standby" : "approaching";
  }

  // Remove vehicles that finished at Marathahalli.
  w.vehicles = w.vehicles.filter((v) => !(v.lastStop === LAST_STOP && v.dwellLeft <= 0));

  // Regular departures from Silk Board, one headway apart.
  w.sinceSpawn += dt;
  if (w.sinceSpawn >= headwayMin(w.night)) {
    w.sinceSpawn = 0;
    const v = makeVehicle(rng, w.nextId++, 0, w.night, w.vehicles);
    v.lastStop = -1; // serves Silk Board on its first step
    v.seats = v.capacity; // first stop, so it leaves empty
    w.vehicles.push(v);
  }

  w.standbyCooldown = Math.max(0, w.standbyCooldown - dt);
  sendStandbyIfGap(w, rng);

  w.rngState = rng.state;
  return w;
}
