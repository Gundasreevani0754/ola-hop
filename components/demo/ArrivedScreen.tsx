"use client";

import { getRoute } from "@/lib/network";
import { useHop } from "@/lib/store";
import { btn } from "./ui";

export default function ArrivedScreen() {
  const night = useHop((s) => s.world.night);
  const routeKey = useHop((s) => s.world.routeKey);
  const rider = useHop((s) => s.rider);
  const rate = useHop((s) => s.rate);
  const markHomeSafe = useHop((s) => s.markHomeSafe);
  const finishRide = useHop((s) => s.finishRide);

  const done = rider.done;
  if (!done) return null;
  const paid = done.fare - done.credit;
  const waited = done.waited < 1 ? "under a minute" : `${Math.round(done.waited)} min`;

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <p className="label">Arrived</p>
        <h1 className="mt-1.5 font-display text-[26px] font-extrabold leading-[1.1] tracking-tight">
          You&apos;re at {getRoute(routeKey).stops[rider.to].name}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          ₹{paid} paid by UPI{done.credit > 0 && ` (₹${done.credit} credit used)`} · waited {waited}
        </p>
      </div>

      {night && (
        <div className="flex flex-col gap-3 rounded-[20px] bg-surface p-[18px]">
          <b>Tell us when you&apos;re home</b>
          <span className="text-[13px] text-muted">
            If we don&apos;t hear from you in 10 minutes, we alert Amma and Rahul.
          </span>
          <button
            type="button"
            className={btn.primary}
            onClick={markHomeSafe}
            disabled={rider.homeSafe}
          >
            {rider.homeSafe ? "Home safe ✓" : "I'm home safe"}
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-3 rounded-[20px] bg-surface p-[18px]">
        <b>How was the ride?</b>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
              aria-pressed={n <= rider.rating}
              onClick={() => rate(n)}
              className={`h-12 w-12 rounded-xl text-xl ${
                n <= rider.rating ? "bg-auto text-[#1a1300]" : "bg-page text-muted"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <button type="button" className={btn.quiet} onClick={finishRide}>
        Done
      </button>
    </div>
  );
}
