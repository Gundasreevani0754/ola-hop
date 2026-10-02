import type { Metadata } from "next";
import SimReadout from "@/components/SimReadout";

export const metadata: Metadata = { title: "Driver" };

export default function DriverPage() {
  return <SimReadout title="Driver app" />;
}
