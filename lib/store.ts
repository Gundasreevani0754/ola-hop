"use client";

import { create } from "zustand";
import { LINE, STOPS } from "./line";
import {
  advanceRider,
  findVehicle,
  FULL_CREDIT,
  initialRider,
  SKIP_SPEED,
  TRIP_SPEED,
  updateVehicle,
  type RiderState,
} from "./rider";
import { createWorld, SIM_MIN_PER_REAL_SEC, step, TYPES, upcoming } from "./sim";
import { TOUR } from "./tour";
import type { Filter, World } from "./types";

export interface Toast {
  id: number;
  text: string;
}

export interface HopState {
  world: World;
  rider: RiderState;
  /** Simulated minutes per real second. Changes while waiting at the stop or riding. */
  speed: number;
  toast: Toast | null;
  /** The leave-now notification has been shown this session. */
  notified: boolean;
  tour: { active: boolean; step: number };

  tick: (realMs: number) => void;
  setNight: (night: boolean) => void;
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

  /** Restart the line at 8:24 am (or 9:40 pm), keeping the rider's filter. */
  resetLine: () => void;
  startTour: () => void;
  nextTourStep: () => void;
  endTour: () => void;
}

// Keep each step small so fast-forwarded trips still serve every stop.
const MAX_STEP_MIN = 0.1;
let toastId = 0;

const randomCode = () => String(Math.floor(1000 + Math.random() * 9000));

export const useHop = create<HopState>()((set, get) => ({
  world: createWorld(false),
  rider: initialRider,
  speed: SIM_MIN_PER_REAL_SEC,
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

    set({
      world: w,
      rider: r,
      speed,
      ...(toast ? { toast: { id: ++toastId, text: toast } } : {}),
    });
  },

  setNight: (night) =>
    set((s) => ({
      world: createWorld(night),
      rider: {
        ...initialRider,
        filter: night && s.rider.filter === "bus" ? "all" : s.rider.filter,
        missesThisWeek: s.rider.missesThisWeek,
        credit: s.rider.credit,
      },
      speed: SIM_MIN_PER_REAL_SEC,
    })),
  showToast: (text) => set({ toast: { id: ++toastId, text } }),
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
        toast: { id: ++toastId, text: "Seat released" },
      };
    }),

  skipAhead: () => set({ speed: SKIP_SPEED }),

  // Demo of the PRD's promise: if a held seat arrives full, the rider gets
  // ₹10 credit and the next vehicle's seat is held straight away.
  arrivesFull: () => {
    const s = get();
    const hold = s.rider.hold;
    if (!hold) return;
    const next = upcoming(s.world, LINE.riderStop, s.rider.filter).find(
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
      const waited = Math.max(0, hold.arrivedAt - hold.heldAt);
      let world = updateVehicle(s.world, v.id, () => ({ holdLeft: 0 }));
      world = {
        ...world,
        metrics: {
          ...world.metrics,
          rides: world.metrics.rides + 1,
          ridesWait5: world.metrics.ridesWait5 + (waited <= 5 ? 1 : 0),
          fares: { ...world.metrics.fares, [v.type]: world.metrics.fares[v.type] + TYPES[v.type].fare },
        },
      };
      return {
        world,
        rider: {
          ...s.rider,
          view: "trip",
          hold: null,
          trip: {
            vehicleId: v.id,
            code: hold.code,
            startKm: STOPS[LINE.riderStop].km,
            waited,
            snapshot: v,
          },
        },
        speed: TRIP_SPEED,
      };
    }),

  rate: (stars) => set((s) => ({ rider: { ...s.rider, rating: stars } })),
  markHomeSafe: () =>
    set((s) => ({
      rider: { ...s.rider, homeSafe: true },
      toast: { id: ++toastId, text: "Family notified" },
    })),
  finishRide: () =>
    set((s) => ({
      rider: {
        ...initialRider,
        filter: s.rider.filter,
        missesThisWeek: s.rider.missesThisWeek,
        credit: s.rider.credit,
      },
      speed: SIM_MIN_PER_REAL_SEC,
    })),

  resetLine: () =>
    set((s) => ({
      world: createWorld(s.world.night),
      rider: { ...initialRider, filter: s.rider.filter, credit: s.rider.credit },
      speed: SIM_MIN_PER_REAL_SEC,
    })),
  startTour: () => {
    set({
      world: createWorld(false),
      rider: initialRider,
      speed: SIM_MIN_PER_REAL_SEC,
      tour: { active: true, step: 0 },
    });
  },
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
