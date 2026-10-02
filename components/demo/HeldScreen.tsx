"use client";

import { getRoute } from "@/lib/network";
import { findVehicle, holdSecondsLeft } from "@/lib/rider";
import { displayMin, etaMin, fareFor, TYPES } from "@/lib/sim";
import { useHop } from "@/lib/store";
import { btn } from "./ui";

export default function HeldScreen() {
  const world = useHop((s) => s.world);
  const hold = useHop((s) => s.rider.hold);
  const from = useHop((s) => s.rider.from);
  const to = useHop((s) => s.rider.to);
  const releaseSeat = useHop((s) => s.releaseSeat);
  const skipAhead = useHop((s) => s.skipAhead);
  const arrivesFull = useHop((s) => s.arrivesFull);
  const board = useHop((s) => s.board);
  const speed = useHop((s) => s.speed);

  if (!hold) return null;
  const v = findVehicle(world, hold.vehicleId) ?? hold.snapshot;
  const label = TYPES[v.type].label;
  const route = getRoute(world.routeKey);
  const stop = route.stops[from].name;
  const dest = route.stops[to];
  const fare = fareFor(v.type, dest.km - route.stops[from].km);
  const arrived = hold.arrivedAt !== null;
  const eta = etaMin(route, v, from) ?? 0;
  const secs = holdSecondsLeft(world, hold);
  const bus = v.type === "bus";

  return (
    <div className="flex flex-col gap-[18px]">
      <button type="button" onClick={releaseSeat} className="self-start text-sm font-semibold text-muted">
        ← Release seat
      </button>

      <div>
        <p className="label">Seat held</p>
        <h1 className="mt-1.5 font-display text-[26px] font-extrabold leading-[1.1] tracking-tight">
          {arrived ? (
            <>
              {label} is at {stop}
            </>
          ) : (
            <>
              {label} reaches {stop} in <span className="tabular">{Math.max(1, displayMin(eta))}</span> min
            </>
          )}
        </h1>
        {arrived && secs !== null && (
          <p className="mt-2 inline-block rounded-full bg-accent-soft px-3 py-1 text-[13px] font-semibold">
            Waiting for you{secs > 0 && <> · <span className="tabular">{secs}</span> s left</>}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-[20px] bg-surface p-[18px]">
        <p className="label text-center">Show this code when you board</p>
        <p className="py-2 text-center font-display text-[40px] font-extrabold tracking-[0.18em]">
          {hold.code}
        </p>
        <Row k={bus ? "Operator" : "Driver"} v={bus ? v.driverName : `${v.driverName} ✓`} />
        <Row k="Vehicle" v={v.plate} />
        <Row k={`Fare to ${dest.name}`} v={`₹${fare}`} />
      </div>

      <p className="text-[13px] text-muted">
        Stand at the {world.night ? route.nightCode : route.code} sign at {stop} bus stop. Your seat is held until 60 seconds after the
        vehicle arrives.
      </p>

      {arrived ? (
        <button type="button" className={btn.primary} onClick={board}>
          I&apos;ve boarded
        </button>
      ) : (
        <button type="button" className={btn.quiet} onClick={skipAhead} disabled={speed > 0.5}>
          {speed > 0.5 ? "Skipping ahead…" : "Skip ahead to arrival"}
        </button>
      )}
      <button type="button" className={`${btn.link} self-center`} onClick={arrivesFull}>
        {arrived ? "It arrived full" : "What if it arrives full?"}
      </button>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{k}</span>
      <b>{v}</b>
    </div>
  );
}
