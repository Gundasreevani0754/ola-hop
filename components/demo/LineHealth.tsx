"use client";

import { getRoute } from "@/lib/network";
import { formatClock, median, TYPES } from "@/lib/sim";
import { useHop } from "@/lib/store";
import type { VehicleType } from "@/lib/types";
import { VehicleDot } from "./ui";

const ORDER: VehicleType[] = ["auto", "car", "bus"];

/** The line behind the app: the PRD's north star, waits, driver earnings and gap control. */
export default function LineHealth() {
  const world = useHop((s) => s.world);
  const m = world.metrics;
  const med = median(m.recentWaits);
  const autoHours = m.vehicleMinutes.auto / 60;
  const autoPerHour = autoHours > 0 ? Math.round(m.fares.auto / autoHours) : null;
  const since = world.night ? "8 pm" : "6 am";
  const route = getRoute(world.routeKey);
  const lineLabel = `${world.night ? route.nightCode : route.code} ${route.stops[0].name} → ${route.stops[route.stops.length - 1].name}`;
  const counts = ORDER.map((t) => [t, world.vehicles.filter((v) => v.type === t).length] as const).filter(
    ([, n]) => n > 0,
  );
  const latest = world.events[world.events.length - 1];

  return (
    <section aria-labelledby="health-title" className="rounded-3xl bg-page p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="health-title" className="font-display text-lg font-extrabold tracking-tight">
          Line health
        </h2>
        <p className="text-xs text-muted">
          {lineLabel} · simulated since {since}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile
          label="Rides with a wait of 5 min or less"
          value={`${m.ridesWait5.toLocaleString("en-IN")}`}
          note={`of ${m.rides.toLocaleString("en-IN")} rides`}
          strong
        />
        <Tile label="Median wait" value={med === null ? "–" : `${med.toFixed(1)} min`} note="target 5 min or less" />
        <Tile
          label="Auto earnings per hour"
          value={autoPerHour === null ? "–" : `₹${autoPerHour}`}
          note="fares ÷ hours on the line"
        />
        <div className="rounded-2xl bg-surface p-3.5">
          <p className="text-xs leading-snug text-muted">On the line now</p>
          <ul className="mt-2 space-y-1 text-sm font-semibold">
            {counts.map(([t, n]) => (
              <li key={t} className="flex items-center gap-2">
                <VehicleDot type={t} />
                <span className="tabular">{n}</span> {TYPES[t].label.toLowerCase()}
                {n === 1 ? "" : t === "bus" ? "es" : "s"}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 text-[13px] text-muted" aria-live="polite">
        <span className="font-semibold text-fg">Keeping gaps even:</span>{" "}
        {latest ? (
          <>
            <span className="tabular">{formatClock(latest.t)}</span> · {latest.text}
          </>
        ) : (
          "no vehicles bunched yet"
        )}
      </p>
    </section>
  );
}


function Tile({ label, value, note, strong }: { label: string; value: string; note: string; strong?: boolean }) {
  return (
    <div className={`rounded-2xl p-3.5 ${strong ? "bg-accent-soft" : "bg-surface"}`}>
      <p className="text-xs leading-snug text-muted">{label}</p>
      <p className="tabular mt-1.5 font-display text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{note}</p>
    </div>
  );
}
