"use client";

import { MotionConfig } from "framer-motion";
import dynamic from "next/dynamic";
import { useHop, type Profile } from "@/lib/store";
import LineHealth from "./LineHealth";
import Phone from "./Phone";
import TourBar from "./TourBar";

// Leaflet needs the browser, so the map only renders on the client.
const LineMap = dynamic(() => import("./LineMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface" />,
});

export default function DemoView() {
  const night = useHop((s) => s.world.night);

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
