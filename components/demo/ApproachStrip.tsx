"use client";

import { getRoute } from "@/lib/network";
import { upcoming } from "@/lib/sim";
import { useHop } from "@/lib/store";

/** The rider's stop and up to two stops before it, with vehicles sliding towards the rider. */
export default function ApproachStrip() {
  const world = useHop((s) => s.world);
  const filter = useHop((s) => s.rider.filter);
  const from = useHop((s) => s.rider.from);
  const route = getRoute(world.routeKey);
  const fromKm = route.stops[from].km;
  const shown = route.stops.slice(Math.max(0, from - 2), from + 1);
  // At a route's first stop, vehicles come from the depot just behind it.
  const startKm = from === 0 ? -1.2 : shown[0].km;
  const span = fromKm + 0.5 - startKm;
  const x = (km: number) => Math.max(0, Math.min(100, ((km - startKm) / span) * 100));
  const vehicles = upcoming(world, from, filter)
    .map((u) => u.v)
    .filter((v) => v.posKm >= startKm - 0.3);

  // Skip a label if it would crowd the one before it; the rider's stop always shows.
  const labels = shown.reduce<{ show: boolean[]; last: number }>(
    (acc, s, i) => {
      const pos = x(s.km);
      const show = i === shown.length - 1 || pos - acc.last > 30;
      return { show: [...acc.show, show], last: show ? pos : acc.last };
    },
    { show: [], last: -100 },
  ).show;

  return (
    <div
      className="relative mx-1.5 h-14"
      role="img"
      aria-label={`${vehicles.length} vehicles on the way to ${route.stops[from].name}`}
    >
      <div className="absolute inset-x-0 top-3.5 h-1 rounded bg-hair" />
      <div className="absolute left-0 top-3.5 h-1 rounded bg-accent opacity-25" style={{ width: `${x(fromKm)}%` }} />
      {from === 0 && (
        <span className="absolute left-0 top-8 text-[11px] text-muted">from depot</span>
      )}
      {shown.map((s, i) => {
        const me = i === shown.length - 1;
        return (
          <div key={s.id}>
            <span
              className={`absolute rounded-full bg-page ${
                me
                  ? "top-[7px] -ml-[9px] h-[18px] w-[18px] border-[3px] border-accent shadow-[0_0_0_5px_var(--accent-soft)]"
                  : "top-[9px] -ml-[7px] h-3.5 w-3.5 border-[3px] border-muted"
              }`}
              style={{ left: `${x(s.km)}%` }}
            />
            {labels[i] && (
              <span
                // The rider's label hugs the right edge so long names never spill out.
                className={`absolute top-8 whitespace-nowrap text-[11px] ${
                  me ? "-right-1.5 font-bold text-fg" : "text-muted"
                } ${!me && x(s.km) < 8 ? "-ml-1.5" : !me ? "-translate-x-1/2" : ""}`}
                style={me ? undefined : { left: `${x(s.km)}%` }}
              >
                {me ? `${s.name} · you` : s.name}
              </span>
            )}
          </div>
        );
      })}
      {vehicles.map((v) => (
        <span
          key={v.id}
          className={`absolute top-1.5 -ml-2.5 h-5 w-5 border-[3px] border-page shadow-[0_1px_4px_rgba(0,0,0,.25)] transition-[left] duration-500 ease-linear ${
            v.type === "bus" ? "rounded-md" : "rounded-full"
          }`}
          style={{ left: `${x(v.posKm)}%`, background: `var(--${v.type})` }}
        />
      ))}
    </div>
  );
}
