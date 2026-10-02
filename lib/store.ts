"use client";

import { create } from "zustand";
import { createWorld, SIM_MIN_PER_REAL_SEC, step } from "./sim";
import type { World } from "./types";

interface HopState {
  world: World;
  /** Simulated minutes per real second. Raised briefly to fast-forward a trip. */
  speed: number;
  paused: boolean;
  tick: (realMs: number) => void;
  setNight: (night: boolean) => void;
  setSpeed: (speed: number) => void;
  setPaused: (paused: boolean) => void;
  reset: () => void;
}

// Keep each step small so fast-forwarded trips still serve every stop.
const MAX_STEP_MIN = 0.1;

export const useHop = create<HopState>()((set, get) => ({
  world: createWorld(false),
  speed: SIM_MIN_PER_REAL_SEC,
  paused: false,

  tick: (realMs) => {
    const { paused, speed } = get();
    if (paused) return;
    let remaining = (realMs / 1000) * speed;
    let w = get().world;
    while (remaining > 1e-9) {
      const dt = Math.min(MAX_STEP_MIN, remaining);
      w = step(w, dt);
      remaining -= dt;
    }
    set({ world: w });
  },

  setNight: (night) => set({ world: createWorld(night) }),
  setSpeed: (speed) => set({ speed }),
  setPaused: (paused) => set({ paused }),
  reset: () => set({ world: createWorld(get().world.night), speed: SIM_MIN_PER_REAL_SEC }),
}));
