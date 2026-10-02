"use client";

import { useHop } from "@/lib/store";
import { TOUR } from "@/lib/tour";

export default function TourBar() {
  const state = useHop();
  const { tour, nextTourStep, endTour, startTour } = state;

  if (!tour.active) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-page px-5 py-4">
        <p className="text-sm text-muted">
          <b className="text-fg">Free play.</b> Tap around the phone: hold a seat, switch vehicle
          types, or turn on Night Line.
        </p>
        <button
          type="button"
          onClick={startTour}
          className="rounded-xl border border-hair px-4 py-2 text-sm font-bold"
        >
          Restart guided tour
        </button>
      </div>
    );
  }

  const step = TOUR[tour.step];
  const ready = step.ready ? step.ready(state) : true;
  const last = tour.step === TOUR.length - 1;

  return (
    <section
      aria-label="Guided tour"
      className="flex flex-col gap-4 rounded-3xl bg-page p-5 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="max-w-2xl">
        <p className="label">
          Guided tour · step {tour.step + 1} of {TOUR.length}
        </p>
        <h2 className="mt-1.5 font-display text-xl font-extrabold tracking-tight" aria-live="polite">
          {step.title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted sm:text-[15px]">{step.body}</p>
      </div>
      <div className="flex flex-none items-center gap-3">
        <button type="button" onClick={endTour} className="text-sm font-semibold text-muted hover:text-fg">
          Skip tour
        </button>
        <button
          type="button"
          onClick={nextTourStep}
          disabled={!ready}
          className="min-w-32 rounded-xl bg-accent px-5 py-3 font-bold text-on-accent transition-opacity disabled:opacity-50"
        >
          {!ready ? `${step.waiting ?? "Wait"}…` : last ? "Finish" : "Next"}
        </button>
      </div>
    </section>
  );
}
