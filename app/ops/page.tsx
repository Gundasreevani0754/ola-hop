import type { Metadata } from "next";
import SimReadout from "@/components/SimReadout";

export const metadata: Metadata = { title: "Ops" };

export default function OpsPage() {
  return <SimReadout title="Ops dashboard" />;
}
