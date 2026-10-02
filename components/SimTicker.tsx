"use client";

import { useEffect } from "react";
import { useHop } from "@/lib/store";

const TICK_MS = 500;

/** Runs the one shared simulation for every page. Mounted once in the root layout. */
export default function SimTicker() {
  const tick = useHop((s) => s.tick);

  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      // Cap the catch-up after a background tab wakes, so vehicles don't jump.
      tick(Math.min(now - last, 2000));
      last = now;
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [tick]);

  return null;
}
