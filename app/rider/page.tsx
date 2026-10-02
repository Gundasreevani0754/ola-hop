import type { Metadata } from "next";
import SimReadout from "@/components/SimReadout";

export const metadata: Metadata = { title: "Rider" };

export default function RiderPage() {
  return <SimReadout title="Rider app" />;
}
