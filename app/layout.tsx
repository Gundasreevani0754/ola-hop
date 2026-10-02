import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import Nav from "@/components/Nav";
import Disclaimer from "@/components/Disclaimer";
import SimTicker from "@/components/SimTicker";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ola Hop · concept prototype",
    template: "%s · Ola Hop",
  },
  description:
    "Shared autos, cabs and buses that run like a metro. A concept prototype for an APM assessment, with simulated data. Not an official Ola product.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eceeed" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d0c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} ${figtree.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SimTicker />
        <Nav />
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="px-4 py-5">
          <Disclaimer />
        </footer>
      </body>
    </html>
  );
}
