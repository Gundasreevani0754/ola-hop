"use client";

import { create } from "zustand";
import { DEFAULT_TRIP, findTrip, getRoute } from "./network";
import {
  advanceRider,
  findVehicle,
  FULL_CREDIT,
  initialRider,
  SKIP_SPEED,
  tripSpeed,
  updateVehicle,
  type RiderState,
} from "./rider";
import { createWorld, fareFor, SIM_MIN_PER_REAL_SEC, step, TYPES, upcoming } from "./sim";
import { TOUR } from "./tour";
import type { Filter, World } from "./types";

export interface Toast {
  id: number;
  text: string;
}

/** Who is logged in. In the product this comes from the rider's profile, checked once at sign-up. */
export type Profile = "woman" | "man";

export interface HopState {
  world: World;
  rider: RiderState;
  profile: Profile;
  /** Simulated minutes per real second. Changes while waiting at the stop or riding. */
  speed: number;
  toast: Toast | null;
  /** The leave-now notification has been shown this session. */
  notified: boolean;
  tour: { active: boolean; step: number };

  tick: (realMs: number) => void;
  selectTrip: (from: string, to: string) => void;
  setNight: (night: boolean) => void;
  setProfile: (profile: Profile) => void;
  showToast: (text: string) => void;
  clearToast: (id: number) => void;
  setNotified: () => void;

  setFilter: (filter: Filter) => void;
  holdSeat: (vehicleId: number, code?: string) => void;
  releaseSeat: () => void;
  skipAhead: () => void;
  arrivesFull: () => void;
  board: () => void;
  rate: (stars: number) => void;
  markHomeSafe: () => void;
  finishRide: () => void;

  /** Restart the route at 8:24 am (or 9:40 pm), keeping the rider's choices. */
  resetLine: () => void;
  startTour: () => void;
  nextTourStep: () => void;
  endTour: () => void;
}

// Keep each step small so fast-forwarded trips still serve every stop.
const MAX_STEP_MIN = 0.1;
let toastId = 0;
const toastOf = (text: string): Toast => ({ id: ++toastId, text });

const randomCode = () => String(Math.floor(1000 + Math.random() * 9000));

/** A fresh world and rider for a trip between two places. */
function startTrip(from: string, to: string, night: boolean, keep: Partial<RiderState> = {}) {
  const trip = findTrip(from, to) ?? findTrip(DEFAULT_TRIP.from, DEFAULT_TRIP.to)!;
  return {
    world: createWorld(night, trip.route.key, trip.from),
    rider: { ...initialRider, ...keep, from: trip.from, to: trip.to },
    speed: SIM_MIN_PER_REAL_SEC,
  };
}

/** The rider's current boarding and drop-off places. */
export function tripPlaces(s: Pick<HopState, "world" | "rider">) {
  const stops = getRoute(s.world.routeKey).stops;
  return { from: stops[s.rider.from].name, to: stops[s.rider.to].name };
}

const keepChoices = (r: RiderState): Partial<RiderState> => ({
  filter: r.filter,
  credit: r.credit,
  missesThisWeek: r.missesThisWeek,
});

export const useHop = create<HopState>()((set, get) => ({
  ...startTrip(DEFAULT_TRIP.from, DEFAULT_TRIP.to, false),
  profile: "woman",
  toast: null,
  notified: false,
  tour: { active: true, step: 0 },

  tick: (realMs) => {
    const s = get();
    let realLeft = realMs / 1000;
    let speed = s.speed;
    let w = s.world;
    let r = s.rider;
    let toast: string | undefined;

    while (realLeft > 1e-6) {
      const dt = Math.min(MAX_STEP_MIN, realLeft * speed);
      w = step(w, dt);
      realLeft -= dt / speed;
      const out = advanceRider(w, r, s.tour.active);
      w = out.world;
      r = out.rider;
      if (out.toast) toast = out.toast;
      if (out.speed !== undefined) speed = out.speed;
    }

    set({ world: w, rider: r, speed, ...(toast ? { toast: toastOf(toast) } : {}) });
  },

  selectTrip: (from, to) =>
    set((s) => {
      if (!findTrip(from, to)) return {};
      return startTrip(from, to, s.world.night, keepChoices(s.rider));
    }),

  setNight: (night) =>
    set((s) => {
      if (night && s.profile !== "woman") {
        return { toast: toastOf("Night Line is for women riders only.") };
      }
      const { from, to } = tripPlaces(s);
      const keep = keepChoices(s.rider);
      if (night && keep.filter === "bus") keep.filter = "all";
      return startTrip(from, to, night, keep);
    }),

  setProfile: (profile) =>
    set((s) => {
      if (profile === "man" && s.world.night) {
        const { from, to } = tripPlaces(s);
        return {
          profile,
          ...startTrip(from, to, false, keepChoices(s.rider)),
          toast: toastOf("Night Line is for women riders, so Arjun sees the regular line."),
        };
      }
      return { profile };
    }),

  showToast: (text) => set({ toast: toastOf(text) }),
  clearToast: (id) => set((s) => (s.toast?.id === id ? { toast: null } : {})),
  setNotified: () => set({ notified: true }),

  setFilter: (filter) => set((s) => ({ rider: { ...s.rider, filter } })),

  holdSeat: (vehicleId, code) =>
    set((s) => {
      const v = findVehicle(s.world, vehicleId);
      if (!v || v.seats < 1) return {};
      return {
        world: updateVehicle(s.world, vehicleId, (x) => ({ seats: x.seats - 1 })),
        rider: {
          ...s.rider,
          view: "held",
          hold: {
            vehicleId,
            code: code ?? randomCode(),
            heldAt: s.world.t,
            arrivedAt: null,
            snapshot: { ...v, seats: v.seats - 1 },
          },
        },
      };
    }),

  releaseSeat: () =>
    set((s) => {
      const hold = s.rider.hold;
      if (!hold) return {};
      return {
        world: updateVehicle(s.world, hold.vehicleId, (x) => ({
          seats: Math.min(x.capacity, x.seats + 1),
          // If it was waiting for us, let it go.
          holdLeft: hold.arrivedAt !== null ? 0 : x.holdLeft,
        })),
        rider: { ...s.rider, view: "home", hold: null },
        speed: SIM_MIN_PER_REAL_SEC,
        toast: toastOf("Seat released"),
      };
    }),

  skipAhead: () => set({ speed: SKIP_SPEED }),

  // Demo of the PRD's promise: if a held seat arrives full, the rider gets
  // ₹10 credit and the next vehicle's seat is held straight away.
  arrivesFull: () => {
    const s = get();
    const hold = s.rider.hold;
    if (!hold) return;
    const next = upcoming(s.world, s.rider.from, s.rider.filter).find(
      (x) => x.v.id !== hold.vehicleId && x.v.seats > 0,
    );
    set({
      world: updateVehicle(s.world, hold.vehicleId, () => ({ seats: 0, holdLeft: 0 })),
      rider: { ...s.rider, view: "home", hold: null, credit: s.rider.credit + FULL_CREDIT },
      speed: SIM_MIN_PER_REAL_SEC,
    });
    if (next) {
      get().holdSeat(next.v.id);
      get().showToast(
        `It arrived full. ₹${FULL_CREDIT} credit added, and your seat on the next ${TYPES[next.v.type].label.toLowerCase()} is held.`,
      );
    } else {
      get().showToast(`It arrived full. ₹${FULL_CREDIT} credit added.`);
    }
  },

  board: () =>
    set((s) => {
      const hold = s.rider.hold;
      if (!hold || hold.arrivedAt === null) return {};
      const v = findVehicle(s.world, hold.vehicleId);
      if (!v) return {};
      const stops = getRoute(s.world.routeKey).stops;
      const km = stops[s.rider.to].km - stops[s.rider.from].km;
      const waited = Math.max(0, hold.arrivedAt - hold.heldAt);
      let world = updateVehicle(s.world, v.id, () => ({ holdLeft: 0 }));
      world = {
        ...world,
        metrics: {
          ...world.metrics,
          rides: world.metrics.rides + 1,
          ridesWait5: world.metrics.ridesWait5 + (waited <= 5 ? 1 : 0),
          fares: { ...world.metrics.fares, [v.type]: world.metrics.fares[v.type] + fareFor(v.type, km) },
        },
      };
      return {
        world,
        rider: {
          ...s.rider,
          view: "trip",
          hold: null,
          trip: { vehicleId: v.id, code: hold.code, startKm: stops[s.rider.from].km, waited, snapshot: v },
        },
        speed: tripSpeed(km, s.rider.to - s.rider.from),
      };
    }),

  rate: (stars) => set((s) => ({ rider: { ...s.rider, rating: stars } })),
  markHomeSafe: () =>
    set((s) => ({ rider: { ...s.rider, homeSafe: true }, toast: toastOf("Family notified") })),
  finishRide: () =>
    set((s) => ({
      rider: { ...initialRider, ...keepChoices(s.rider), from: s.rider.from, to: s.rider.to },
      speed: SIM_MIN_PER_REAL_SEC,
    })),

  resetLine: () =>
    set((s) => {
      const { from, to } = tripPlaces(s);
      return startTrip(from, to, s.world.night, keepChoices(s.rider));
    }),
  startTour: () =>
    set({
      ...startTrip(DEFAULT_TRIP.from, DEFAULT_TRIP.to, false),
      profile: "woman",
      tour: { active: true, step: 0 },
    }),
  nextTourStep: () => {
    const { tour } = get();
    const step = tour.step + 1;
    if (step >= TOUR.length) {
      set({ tour: { active: false, step: 0 } });
      return;
    }
    set({ tour: { active: true, step } });
    TOUR[step].enter?.(get());
  },
  endTour: () => set({ tour: { active: false, step: 0 } }),
}));
