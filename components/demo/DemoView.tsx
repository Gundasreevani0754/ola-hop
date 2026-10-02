"use client";

import { MotionConfig } from "framer-motion";
import dynamic from "next/dynamic";
import { useHop } from "@/lib/store";
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
          <Phone />
          <div className="flex flex-col gap-5">
            <div className="h-[320px] overflow-hidden rounded-3xl bg-surface sm:h-[420px] lg:h-[476px]">
              <LineMap />
            </div>
            <LineHealth />
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
