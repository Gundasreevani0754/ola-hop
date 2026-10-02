"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Wordmark from "./Wordmark";

const LINKS = [
  { href: "/rider", label: "Rider" },
  { href: "/driver", label: "Driver" },
  { href: "/ops", label: "Ops" },
];

export default function Nav() {
  const path = usePathname();

  return (
    <header className="px-4 pt-4">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4"
      >
        <Link href="/" aria-label="Ola Hop home" className="rounded-md">
          <Wordmark />
        </Link>
        <ul className="flex gap-1 rounded-xl bg-surface p-1 text-sm font-semibold">
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-lg px-3 py-1.5 transition-colors ${
                    active ? "bg-page text-fg shadow-sm" : "text-muted hover:text-fg"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
