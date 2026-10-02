"use client";

// Phase 0 check panel: proves the shared simulation runs. Replaced by real screens later.
import { LINE, STOPS } from "@/lib/line";
import { displayMin, formatClock, median, TYPES, upcoming } from "@/lib/sim";
import { useHop } from "@/lib/store";

export default function SimReadout({ title }: { title: string }) {
  const world = useHop((s) => s.world);
  const setNight = useHop((s) => s.setNight);
  const next = upcoming(world, LINE.riderStop).slice(0, 4);
  const med = median(world.metrics.recentWaits);

  return (
    <section className={`mx-auto w-full max-w-xl px-4 py-8 ${world.night ? "night" : ""}`}>
      <p className="label">{title} · coming in the next phase</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
        Simulation check
      </h1>
      <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
        <Stat label="Clock" value={formatClock(world.t)} />
        <Stat label="On line" value={String(world.vehicles.length)} />
        <Stat label="Rides" value={`${world.metrics.ridesWait5}/${world.metrics.rides}`} />
        <Stat label="Median wait" value={med === null ? "–" : `${med.toFixed(1)} min`} />
        <Stat label="Waiting" value={String(world.queues.reduce((n, q) => n + q.length, 0))} />
        <Stat label="Mode" value={world.night ? "Night" : "Day"} />
      </div>

      <p className="label mt-8">Next at {STOPS[LINE.riderStop].name}</p>
      <ul className="mt-2 divide-y divide-hair rounded-2xl bg-surface px-4">
        {next.map(({ v, eta }) => (
          <li key={v.id} className="flex items-center justify-between py-3 text-sm">
            <span className="flex items-center gap-2 font-semibold">
              <span
                className={`inline-block h-2.5 w-2.5 ${v.type === "bus" ? "rounded-sm" : "rounded-full"}`}
                style={{ background: `var(--${v.type})` }}
              />
              {TYPES[v.type].label} · {v.driverName} · {v.seats} free
            </span>
            <span className="tabular font-bold">
              {displayMin(eta) === 0 ? "now" : `${displayMin(eta)} min`}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setNight(!world.night)}
        aria-pressed={world.night}
        className="mt-6 rounded-xl bg-accent px-4 py-3 font-bold text-on-accent"
      >
        {world.night ? "Switch to day" : "Switch to Night Line"}
      </button>

      <p className="label mt-8">Line events</p>
      <ul className="mt-2 space-y-1 text-sm text-muted">
        {world.events.length === 0 && <li>None yet</li>}
        {[...world.events].reverse().slice(0, 6).map((e) => (
          <li key={e.id}>
            <span className="tabular">{formatClock(e.t)}</span> · {e.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="tabular mt-1 font-display text-lg font-extrabold">{value}</div>
    </div>
  );
}
