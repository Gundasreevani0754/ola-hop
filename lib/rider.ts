import { LINE, STOPS } from "./line";
import { SIM_MIN_PER_REAL_SEC, TYPES } from "./sim";
import type { Filter, Vehicle, VehicleType, World } from "./types";

export type RiderView = "home" | "held" | "trip" | "arrived";

/** How long a held seat waits once the vehicle reaches the stop, in simulated minutes. */
export const HOLD_AFTER_ARRIVAL_MIN = 1;
/** While the vehicle waits at the stop, run the clock in real time so the 60 s is honest. */
export const REAL_TIME_SPEED = 1 / 60;
/** Trips are fast-forwarded so the 8.7 km ride takes about half a minute. */
export const TRIP_SPEED = 1.2;
export const TRIP_FAST_FORWARD = Math.round(TRIP_SPEED / SIM_MIN_PER_REAL_SEC);
/** "Skip ahead" while waiting for a held vehicle. */
export const SKIP_SPEED = 1.2;
export const FREE_MISSES_PER_WEEK = 2;

export interface Hold {
  vehicleId: number;
  code: string;
  heldAt: number;
  /** Sim time the vehicle reached the stop, or null while it is on the way. */
  arrivedAt: number | null;
  snapshot: Vehicle;
}

export interface Trip {
  vehicleId: number;
  code: string;
  startKm: number;
  waited: number;
  snapshot: Vehicle;
}

export interface Done {
  type: VehicleType;
  fare: number;
  credit: number;
  waited: number;
}

export interface RiderState {
  view: RiderView;
  filter: Filter;
  hold: Hold | null;
  trip: Trip | null;
  done: Done | null;
  rating: number;
  homeSafe: boolean;
  missesThisWeek: number;
  /** Rupees of credit from a vehicle that arrived full, used on the next ride. */
  credit: number;
}

export const initialRider: RiderState = {
  view: "home",
  filter: "all",
  hold: null,
  trip: null,
  done: null,
  rating: 0,
  homeSafe: false,
  missesThisWeek: 0,
  credit: 0,
};

/** Credit given when a held seat arrives full. */
export const FULL_CREDIT = 10;

export function updateVehicle(w: World, id: number, patch: (v: Vehicle) => Partial<Vehicle>): World {
  return {
    ...w,
    vehicles: w.vehicles.map((v) => (v.id === id ? { ...v, ...patch(v) } : v)),
  };
}

export const findVehicle = (w: World, id: number) => w.vehicles.find((v) => v.id === id);

/** Seconds left on a held seat after the vehicle arrived. */
export function holdSecondsLeft(w: World, hold: Hold): number | null {
  if (hold.arrivedAt === null) return null;
  return Math.max(0, Math.ceil((HOLD_AFTER_ARRIVAL_MIN - (w.t - hold.arrivedAt)) * 60));
}

/** Share of the Agara to Marathahalli ride done, 0 to 1. */
export function tripProgress(w: World, trip: Trip): number {
  const v = findVehicle(w, trip.vehicleId);
  const destKm = STOPS[LINE.destStop].km;
  if (!v) return 1;
  return Math.min(1, Math.max(0, (v.posKm - trip.startKm) / (destKm - trip.startKm)));
}

export interface RiderStep {
  world: World;
  rider: RiderState;
  speed?: number;
  toast?: string;
}

/**
 * Move the rider's journey on after each simulation step.
 * `keepHold` stops a held seat from lapsing, so the guided tour can't break
 * while someone is reading a step.
 */
export function advanceRider(w: World, r: RiderState, keepHold = false): RiderStep {
  if (r.view === "held" && r.hold) {
    const hold = r.hold;
    const v = findVehicle(w, hold.vehicleId);

    if (!v) {
      return {
        world: w,
        rider: { ...r, view: "home", hold: null },
        speed: SIM_MIN_PER_REAL_SEC,
        toast: "That vehicle left the line. Pick the next one.",
      };
    }

    if (hold.arrivedAt === null && v.lastStop >= LINE.riderStop) {
      // Vehicle reached the rider's stop: keep it there for up to 60 s.
      const world = updateVehicle(w, v.id, (x) => ({
        holdLeft: Math.max(x.holdLeft, HOLD_AFTER_ARRIVAL_MIN - x.dwellLeft),
      }));
      return {
        world,
        rider: { ...r, hold: { ...hold, arrivedAt: w.t, snapshot: v } },
        speed: REAL_TIME_SPEED,
      };
    }

    if (hold.arrivedAt !== null && w.t - hold.arrivedAt >= HOLD_AFTER_ARRIVAL_MIN) {
      if (keepHold) {
        return { world: updateVehicle(w, v.id, (x) => ({ holdLeft: Math.max(x.holdLeft, 0.05) })), rider: r };
      }
      const misses = r.missesThisWeek + 1;
      const world = updateVehicle(w, v.id, (x) => ({ seats: Math.min(x.capacity, x.seats + 1) }));
      return {
        world,
        rider: { ...r, view: "home", hold: null, missesThisWeek: misses },
        speed: SIM_MIN_PER_REAL_SEC,
        toast:
          misses <= FREE_MISSES_PER_WEEK
            ? `Seat released after 60 s. Miss ${misses} of ${FREE_MISSES_PER_WEEK} free this week.`
            : "Seat released after 60 s. Missed holds now cost ₹10.",
      };
    }
  }

  if (r.view === "trip" && r.trip) {
    const v = findVehicle(w, r.trip.vehicleId);
    if (!v || v.lastStop >= LINE.destStop) {
      const snap = v ?? r.trip.snapshot;
      return {
        world: w,
        rider: {
          ...r,
          view: "arrived",
          done: {
            type: snap.type,
            fare: TYPES[snap.type].fare,
            credit: Math.min(r.credit, TYPES[snap.type].fare),
            waited: r.trip.waited,
          },
          credit: Math.max(0, r.credit - TYPES[snap.type].fare),
          rating: 0,
          homeSafe: false,
        },
        speed: SIM_MIN_PER_REAL_SEC,
      };
    }
  }

  return { world: w, rider: r };
}
