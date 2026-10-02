"use client";

import { MotionConfig } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useSyncExternalStore } from "react";
import { upcoming } from "@/lib/sim";
import { useHop, type Profile } from "@/lib/store";
import LineHealth from "./LineHealth";
import Phone from "./Phone";
import TourBar from "./TourBar";

// Leaflet needs the browser, so the map only renders on the client.
const LineMap = dynamic(() => import("./LineMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

// Screenshot mode for the PRD: /demo#shot-day, #shot-night or #shot-held shows just the phone.
const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const getShot = () => window.location.hash.match(/^#shot-(day|night|held)$/)?.[1] ?? null;

function prepareShot(shot: string) {
  // Print-friendly: always light, whatever the system theme.
  document.documentElement.dataset.theme = "light";
  const s = useHop.getState();
  s.endTour();
  s.setNotified();
  s.setProfile("woman");
  s.setNight(shot === "night");
  if (shot === "held") {
    const { world, rider, holdSeat } = useHop.getState();
    const next = upcoming(world, rider.from).find((x) => x.v.seats > 0);
    if (next) holdSeat(next.v.id, "4729");
  }
}

export default function DemoView() {
  const night = useHop((s) => s.world.night);
  const shot = useSyncExternalStore(subscribeHash, getShot, () => null);

  useEffect(() => {
    if (shot) prepareShot(shot);
  }, [shot]);

  if (shot) {
    return (
      <div className={`fixed inset-0 z-[2000] overflow-hidden bg-desk p-4 ${night ? "night" : ""}`}>
        <Phone />
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className={`mx-auto w-full max-w-6xl px-4 py-6 ${night ? "night" : ""}`}>
        <TourBar />
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[390px_1fr]">
          <div className="flex flex-col gap-3">
            <RiderSwitch />
            <Phone />
          </div>
          {/* Same height as the rider switch plus the phone, so the two columns line up. */}
          <div className="h-[420px] overflow-hidden rounded-3xl bg-surface sm:h-[520px] lg:h-[778px]">
            <LineMap />
          </div>
        </div>
        <div className="mt-5">
          <LineHealth />
        </div>
      </div>
    </MotionConfig>
  );
}

/** Demo only: who is logged in. In the product this is the rider's profile, not a choice. */
function RiderSwitch() {
  const profile = useHop((s) => s.profile);
  const setProfile = useHop((s) => s.setProfile);
  const options: [Profile, string][] = [
    ["woman", "Priya · woman"],
    ["man", "Arjun · man"],
  ];

  return (
    <div className="mx-auto flex h-[46px] w-full max-w-[390px] items-center justify-between gap-3 rounded-2xl bg-page px-3">
      <span className="text-xs font-semibold text-muted">Demo: switch rider</span>
      <div role="group" aria-label="Rider" className="grid grid-cols-2 gap-0.5 rounded-xl bg-surface p-[3px]">
        {options.map(([p, label]) => (
          <button
            key={p}
            type="button"
            aria-pressed={profile === p}
            onClick={() => setProfile(p)}
            className={`rounded-[9px] px-2.5 py-1 text-xs font-semibold ${
              profile === p ? "bg-page text-fg shadow-sm" : "text-muted hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
