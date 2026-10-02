import type { VehicleType } from "@/lib/types";

export const btn = {
  primary:
    "w-full rounded-[14px] bg-accent px-4 py-[15px] text-base font-bold text-on-accent transition-opacity disabled:opacity-40",
  quiet: "w-full rounded-[14px] border border-hair px-4 py-[15px] text-base font-bold text-fg",
  danger: "w-full rounded-[14px] bg-danger px-4 py-[15px] text-base font-bold text-white",
  link: "text-sm font-semibold text-muted underline-offset-4 hover:text-fg hover:underline",
};

export function VehicleDot({ type, className = "" }: { type: VehicleType; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2.5 w-2.5 flex-none ${type === "bus" ? "rounded-[3px]" : "rounded-full"} ${className}`}
      style={{ background: `var(--${type})` }}
    />
  );
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
