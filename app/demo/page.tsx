import type { Metadata } from "next";
import DemoView from "@/components/demo/DemoView";

export const metadata: Metadata = {
  title: "Demo",
  description:
    "A guided demo of Ola Hop on Bengaluru's Outer Ring Road: hold a seat, ride a fixed line and switch to Night Line. Simulated data.",
};

export default function DemoPage() {
  return <DemoView />;
}
