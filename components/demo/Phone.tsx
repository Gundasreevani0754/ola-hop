"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Wordmark from "@/components/Wordmark";
import { LINE, STOPS } from "@/lib/line";
import { displayMin, formatClock, TYPES, upcoming } from "@/lib/sim";
import { useHop } from "@/lib/store";
import ArrivedScreen from "./ArrivedScreen";
import HeldScreen from "./HeldScreen";
import HomeScreen from "./HomeScreen";
import TripScreen from "./TripScreen";
import { btn, plural } from "./ui";

export default function Phone() {
  const view = useHop((s) => s.rider.view);
  const t = useHop((s) => s.world.t);
  const [sos, setSos] = useState(false);

  return (
    <div className="relative mx-auto flex h-[720px] w-full max-w-[390px] flex-col overflow-hidden rounded-[32px] bg-page shadow-[0_24px_60px_-32px_rgba(0,0,0,.35)]">
      <div className="flex items-center justify-between px-[22px] pb-1.5 pt-[22px]">
        <Wordmark />
        <span className="tabular text-[13px] text-muted">{formatClock(t)}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-[22px] pb-6 pt-2.5">
        {/* Swap screens at once and fade the new one in, so a paused tab never shows a stale screen. */}
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {view === "home" && <HomeScreen />}
          {view === "held" && <HeldScreen />}
          {view === "trip" && <TripScreen onSos={() => setSos(true)} />}
          {view === "arrived" && <ArrivedScreen />}
        </motion.div>
      </div>

      <LeaveNow />
      <ToastHost />
      <AnimatePresence>{sos && <SosSheet onClose={() => setSos(false)} />}</AnimatePresence>
    </div>
  );
}

/** The leave-now alert, once per visit, shortly after the page opens. */
function LeaveNow() {
  const onHome = useHop((s) => s.rider.view === "home");
  const notified = useHop((s) => s.notified);
  const setNotified = useHop((s) => s.setNotified);
  const [text, setText] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    if (notified) return;
    const show = window.setTimeout(() => {
      const s = useHop.getState();
      setNotified();
      if (s.rider.view !== "home") return;
      const next = upcoming(s.world, LINE.riderStop, s.rider.filter).find((x) => x.v.seats > 0);
      if (!next) return;
      const code = s.world.night ? LINE.nightCode : LINE.code;
      setText({
        title: `${code} ${TYPES[next.v.type].label.toLowerCase()} at ${STOPS[LINE.riderStop].name} in ${Math.max(1, displayMin(next.eta))} min`,
        body: `${plural(next.v.seats, "seat")} free · ₹${TYPES[next.v.type].fare} to ${STOPS[LINE.destStop].name}. Leave now.`,
      });
    }, 2500);
    return () => window.clearTimeout(show);
  }, [notified, setNotified]);

  useEffect(() => {
    if (!text) return;
    const hide = window.setTimeout(() => setText(null), 6000);
    return () => window.clearTimeout(hide);
  }, [text]);

  return (
    <AnimatePresence>
      {text && onHome && (
        <motion.button
          type="button"
          role="status"
          onClick={() => setText(null)}
          initial={{ y: "-130%" }}
          animate={{ y: 0 }}
          exit={{ y: "-130%" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute inset-x-3 top-3 z-20 rounded-[18px] bg-fg px-[15px] py-[13px] text-left text-[13px] leading-snug text-page shadow-[0_14px_30px_-12px_rgba(0,0,0,.45)]"
        >
          <b className="block text-sm">{text.title}</b>
          {text.body}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function ToastHost() {
  const toast = useHop((s) => s.toast);
  const clearToast = useHop((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const hide = window.setTimeout(() => clearToast(toast.id), 3200);
    return () => window.clearTimeout(hide);
  }, [toast, clearToast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          role="status"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute inset-x-4 bottom-5 z-40 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-2xl bg-fg px-4 py-2.5 text-center text-[13px] font-semibold text-page"
        >
          {toast.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SosSheet({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-end bg-black/35"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sos-title"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.25 }}
        className="flex w-full flex-col gap-3 rounded-t-3xl bg-page p-[22px]"
      >
        <h3 id="sos-title" className="font-display text-xl font-extrabold">
          Help is on the way (demo)
        </h3>
        <p className="text-sm leading-relaxed text-muted">
          Ola&apos;s safety team is calling you. Your live location went to your trusted contacts and
          the police control room.
        </p>
        <button type="button" className={btn.quiet} onClick={onClose} autoFocus>
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}
