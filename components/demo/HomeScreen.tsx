"use client";

import { LINE, STOPS } from "@/lib/line";
import { displayMin, headwayMin, TYPES, upcoming } from "@/lib/sim";
import { useHop } from "@/lib/store";
import type { Filter } from "@/lib/types";
import ApproachStrip from "./ApproachStrip";
import { btn, plural, VehicleDot } from "./ui";

const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["auto", "Auto"],
  ["car", "Cab"],
  ["bus", "Bus"],
];

export default function HomeScreen() {
  const world = useHop((s) => s.world);
  const rider = useHop((s) => s.rider);
  const setFilter = useHop((s) => s.setFilter);
  const holdSeat = useHop((s) => s.holdSeat);
  const setNight = useHop((s) => s.setNight);

  const night = world.night;
  const from = STOPS[LINE.riderStop].name;
  const to = STOPS[LINE.destStop].name;
  const list = upcoming(world, LINE.riderStop, rider.filter);
  const heroIdx = list.findIndex((x) => x.v.seats > 0 && x.eta <= 15);
  const hero = heroIdx >= 0 ? list[heroIdx] : null;
  const rest = hero ? list.slice(heroIdx + 1, heroIdx + 4) : [];

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <p className="label">{night ? "Night Line · women only" : "Your morning commute"}</p>
        <div className="mt-2 flex items-center gap-2.5">
          <span className="rounded-[7px] bg-accent px-2 py-0.5 font-display text-sm font-extrabold text-on-accent">
            {night ? LINE.nightCode : LINE.code}
          </span>
          <div>
            <b className="text-base">
              {from} → {to}
            </b>
            <small className="block text-[13px] text-muted">
              {LINE.name} · every {headwayMin(night)} min · fixed fares
            </small>
          </div>
        </div>
      </div>

      <ApproachStrip />

      <div
        role="group"
        aria-label="Vehicle type"
        className="grid grid-cols-4 gap-0.5 rounded-xl bg-surface p-[3px]"
      >
        {FILTERS.map(([key, label]) => {
          const disabled = night && key === "bus";
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              aria-pressed={rider.filter === key}
              onClick={() => setFilter(key)}
              className={`rounded-[9px] py-2 text-[13px] font-semibold disabled:opacity-35 ${
                rider.filter === key ? "bg-page text-fg shadow-sm" : "text-muted"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {rider.credit > 0 && (
        <p className="rounded-xl bg-accent-soft px-3 py-2 text-[13px] font-semibold">
          ₹{rider.credit} credit on your next ride
        </p>
      )}

      {hero ? (
        <div className="flex flex-col gap-3.5 rounded-[20px] bg-accent-soft p-[18px]">
          <div className="flex items-end justify-between">
            <div>
              <p className="label mb-1.5">Next at {from}</p>
              <p className="flex items-center gap-[7px] text-base font-bold">
                <VehicleDot type={hero.v.type} />
                {TYPES[hero.v.type].label}
                {night && " · woman driver"}
              </p>
            </div>
            <p className="tabular font-display text-[52px] font-extrabold leading-[0.9] tracking-tight">
              {displayMin(hero.eta) === 0 ? (
                "Now"
              ) : (
                <>
                  {displayMin(hero.eta)}
                  <small className="ml-1 text-lg font-bold">min</small>
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted">
            <span>
              <b className="text-fg">{hero.v.seats}</b> {hero.v.seats === 1 ? "seat" : "seats"} free
            </span>
            <span>
              <b className="text-fg">₹{TYPES[hero.v.type].fare}</b> fixed
            </span>
            <span>{hero.v.plate}</span>
          </div>
          <button type="button" className={btn.primary} onClick={() => holdSeat(hero.v.id)}>
            Hold my seat
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1 rounded-[20px] bg-surface p-[18px]">
          <b>Nothing in the next 15 minutes</b>
          <span className="text-sm text-muted">Try All, or book a regular Ola cab.</span>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <p className="label mb-1">Then</p>
          <ul>
            {rest.map(({ v, eta }) => (
              <li
                key={v.id}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3.5 border-t border-hair py-3 text-sm first:border-t-0"
              >
                <span className="flex items-center gap-[7px] font-semibold">
                  <VehicleDot type={v.type} />
                  {TYPES[v.type].label}
                  <span className="ml-1.5 rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-bold text-muted">
                    {v.seats === 0 ? "Full" : plural(v.seats, "seat")}
                  </span>
                </span>
                <span className="tabular text-muted">₹{TYPES[v.type].fare}</span>
                <span className="tabular w-[52px] text-right font-bold">{displayMin(eta)} min</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3.5">
        <span>
          <b className="text-[15px]">Night Line</b>
          <small className="mt-0.5 block text-xs text-muted">
            8 pm to 6 am · women riders and drivers only
          </small>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={night}
          onChange={(e) => setNight(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative h-[26px] w-11 flex-none rounded-full bg-hair transition-colors after:absolute after:left-[3px] after:top-[3px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-[left] peer-checked:bg-accent peer-checked:after:left-[21px] peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
        />
      </label>
      {night && (
        <p className="-mt-2 px-1 text-[13px] leading-relaxed text-muted">
          Lit, audited stops only. Every ride is shared live with your family, and we check you
          reached home.
        </p>
      )}
    </div>
  );
}
