"use client";

import { destinationsFrom, findTrip, getRoute, PLACES, tripKm } from "@/lib/network";
import { displayMin, fareFor, headwayMin, TYPES, upcoming } from "@/lib/sim";
import { tripPlaces, useHop } from "@/lib/store";
import type { Filter, VehicleType } from "@/lib/types";
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
  const profile = useHop((s) => s.profile);
  const setFilter = useHop((s) => s.setFilter);
  const holdSeat = useHop((s) => s.holdSeat);
  const setNight = useHop((s) => s.setNight);

  const night = world.night;
  const route = getRoute(world.routeKey);
  const fromStop = route.stops[rider.from];
  const km = route.stops[rider.to].km - fromStop.km;
  const list = upcoming(world, rider.from, rider.filter);
  const heroIdx = list.findIndex((x) => x.v.seats > 0 && x.eta <= 15);
  const hero = heroIdx >= 0 ? list[heroIdx] : null;
  const rest = hero ? list.slice(heroIdx + 1, heroIdx + 4) : [];
  const woman = profile === "woman";

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <p className="label">{night ? "Night Line · women only" : "Your commute"}</p>
        <RoutePicker />
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
              <p className="label mb-1.5">Next at {fromStop.name}</p>
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
              <b className="text-fg">₹{fareFor(hero.v.type, km)}</b> fixed
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
                <span className="tabular text-muted">₹{fareFor(v.type, km)}</span>
                <span className="tabular w-[52px] text-right font-bold">{displayMin(eta)} min</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label
        className={`flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3.5 ${
          woman ? "cursor-pointer" : "cursor-not-allowed"
        }`}
      >
        <span>
          <b className="text-[15px]">Night Line{!woman && " · women only"}</b>
          <small className="mt-0.5 block text-xs text-muted">
            8 pm to 6 am · women riders and drivers only
          </small>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={night}
          disabled={!woman}
          onChange={(e) => setNight(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative h-[26px] w-11 flex-none rounded-full bg-hair transition-colors after:absolute after:left-[3px] after:top-[3px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-[left] peer-checked:bg-accent peer-checked:after:left-[21px] peer-disabled:opacity-40 peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
        />
      </label>
      {!woman ? (
        <p className="-mt-2 px-1 text-[13px] leading-relaxed text-muted">
          Locked: Night Line is for women riders. Gender comes from your profile, checked once at
          sign-up, so it can&apos;t be switched on here.
        </p>
      ) : (
        night && (
          <p className="-mt-2 px-1 text-[13px] leading-relaxed text-muted">
            Lit, audited stops only. Every ride is shared live with your family, and we check you
            reached home.
          </p>
        )
      )}
    </div>
  );
}

/** From and To pickers. The line is chosen for you: the shortest direct one. */
function RoutePicker() {
  const world = useHop((s) => s.world);
  const rider = useHop((s) => s.rider);
  const selectTrip = useHop((s) => s.selectTrip);
  const { from, to } = tripPlaces({ world, rider });
  const route = getRoute(world.routeKey);
  const km = route.stops[rider.to].km - route.stops[rider.from].km;
  const destinations = destinationsFrom(from);
  const types: VehicleType[] = world.night ? ["auto", "car"] : ["auto", "car", "bus"];

  // Keep the drop-off if it still works; otherwise go to the farthest place on the line.
  const changeFrom = (next: string) => {
    const dests = destinationsFrom(next);
    const farthest = dests.reduce((a, b) => (tripKm(findTrip(next, b)!) > tripKm(findTrip(next, a)!) ? b : a));
    selectTrip(next, dests.includes(to) ? to : farthest);
  };

  return (
    <div className="mt-2 rounded-2xl bg-surface p-3">
      <div className="flex items-center gap-2.5">
        <span className="rounded-[7px] bg-accent px-2 py-0.5 font-display text-sm font-extrabold text-on-accent">
          {world.night ? route.nightCode : route.code}
        </span>
        <span className="text-[13px] text-muted">
          {route.name} · every {headwayMin(world.night)} min · fixed fares
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2">
        <div className="flex flex-col gap-2">
          <PlaceSelect label="From" value={from} options={PLACES} onChange={changeFrom} />
          <PlaceSelect label="To" value={to} options={destinations} onChange={(t) => selectTrip(from, t)} />
        </div>
        <button
          type="button"
          onClick={() => selectTrip(to, from)}
          aria-label="Swap From and To"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-page text-lg font-bold text-muted hover:text-fg"
        >
          ⇅
        </button>
      </div>
      <p className="tabular mt-2.5 text-xs text-muted">
        {km.toFixed(1)} km · {plural(rider.to - rider.from, "stop")} ·{" "}
        {types.map((t) => `${TYPES[t].label} ₹${fareFor(t, km)}`).join(" · ")}
      </p>
    </div>
  );
}

function PlaceSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl bg-page px-3 py-2">
      <span className="w-9 text-xs font-semibold text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 cursor-pointer bg-transparent text-[15px] font-bold text-fg outline-none"
      >
        {options.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </label>
  );
}
