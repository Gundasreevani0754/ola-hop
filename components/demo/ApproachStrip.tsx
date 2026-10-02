"use client";

import { LINE, STOPS } from "@/lib/line";
import { upcoming } from "@/lib/sim";
import { useHop } from "@/lib/store";

/** Silk Board, HSR and Agara in a row, with vehicles sliding towards the rider. */
export default function ApproachStrip() {
  const world = useHop((s) => s.world);
  const filter = useHop((s) => s.rider.filter);
  const riderKm = STOPS[LINE.riderStop].km;
  const span = riderKm + 0.5;
  const x = (km: number) => Math.max(0, Math.min(100, (km / span) * 100));
  const stops = STOPS.slice(0, LINE.riderStop + 1);
  const vehicles = upcoming(world, LINE.riderStop, filter).map((u) => u.v);

  return (
    <div
      className="relative mx-1.5 h-14"
      role="img"
      aria-label={`${vehicles.length} vehicles on the way to ${STOPS[LINE.riderStop].name}`}
    >
      <div className="absolute inset-x-0 top-3.5 h-1 rounded bg-hair" />
      <div
        className="absolute left-0 top-3.5 h-1 rounded bg-accent opacity-25"
        style={{ width: `${x(riderKm)}%` }}
      />
      {stops.map((s, i) => {
        const me = i === LINE.riderStop;
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
            <span
              className={`absolute top-8 whitespace-nowrap text-[11px] ${
                me ? "font-bold text-fg" : "text-muted"
              } ${i === 0 ? "-ml-1.5" : "-translate-x-1/2"}`}
              style={{ left: `${x(s.km)}%` }}
            >
              {me ? `${s.name} · you` : s.name}
            </span>
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
