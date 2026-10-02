"use client";

import { LINE, STOPS } from "@/lib/line";
import { findVehicle, TRIP_FAST_FORWARD, tripProgress } from "@/lib/rider";
import { TYPES } from "@/lib/sim";
import { useHop } from "@/lib/store";
import { btn } from "./ui";

export default function TripScreen({ onSos }: { onSos: () => void }) {
  const world = useHop((s) => s.world);
  const trip = useHop((s) => s.rider.trip);
  const showToast = useHop((s) => s.showToast);

  if (!trip) return null;
  const v = findVehicle(world, trip.vehicleId) ?? trip.snapshot;
  const progress = tripProgress(world, trip);
  const link = `hop.example/t/${trip.code}`;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(link);
      showToast("Trip link copied");
    } catch {
      showToast(link);
    }
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <p className="label">
          On {world.night ? LINE.nightCode : LINE.code} · {TYPES[v.type].label} {v.plate}
        </p>
        <h1 className="mt-1.5 font-display text-[26px] font-extrabold leading-[1.1] tracking-tight">
          Heading to {STOPS[LINE.destStop].name}
        </h1>
      </div>

      <div className="flex flex-col gap-3 rounded-[20px] bg-surface p-[18px]">
        <div className="flex justify-between text-sm text-muted">
          <span>{STOPS[LINE.riderStop].name}</span>
          <span>{STOPS[LINE.destStop].name}</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-hair"
          role="progressbar"
          aria-label="Trip progress"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-accent transition-[width] duration-500 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="flex items-center gap-2 text-[13px] font-semibold text-accent">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          Route guard on · Ola safety team can see this trip
        </p>
        {world.night && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">Shared live with</span>
            <b>Amma, Rahul</b>
          </div>
        )}
      </div>

      <p className="text-xs text-muted">Shown {TRIP_FAST_FORWARD}× faster than real time.</p>

      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" className={btn.quiet} onClick={share}>
          Share trip
        </button>
        <button type="button" className={btn.danger} onClick={onSos}>
          SOS
        </button>
      </div>
    </div>
  );
}
