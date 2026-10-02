import { NETWORK_DATA } from "./network-data";
import { ORR_PATH } from "./orr-path";
import type { Stop } from "./types";

export type LatLng = [number, number];

/** One direction of travel on one line. Every km is measured from this route's first stop. */
export interface Route {
  key: string;
  code: string;
  nightCode: string;
  name: string;
  /** Bus plate shown on this route. */
  busRef: string;
  path: LatLng[];
  cum: number[];
  length: number;
  stops: Stop[];
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function cumulative(path: LatLng[]): number[] {
  return path.reduce<number[]>((acc, p, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + haversineKm(path[i - 1], p));
    return acc;
  }, []);
}

function interpolate(path: LatLng[], cum: number[], km: number): LatLng {
  const last = cum.length - 1;
  if (km <= 0) return path[0];
  if (km >= cum[last]) return path[last];
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= km) lo = mid;
    else hi = mid;
  }
  const t = (km - cum[lo]) / (cum[hi] - cum[lo] || 1);
  const a = path[lo];
  const b = path[hi];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// L3 keeps the ORR path traced for the pilot. HSR sits where the ORR runs along
// HSR Layout, before Agara Lake.
const L3_LENGTH = cumulative(ORR_PATH).at(-1)!;
const LINES = [
  {
    code: "L3",
    name: "ORR Line",
    busRef: "Partner bus 500-D",
    path: ORR_PATH,
    stops: [
      ["Silk Board", 0],
      ["HSR", 1.1],
      ["Agara", 2.4],
      ["Bellandur", 7.0],
      ["Kadubeesanahalli", 9.0],
      ["Marathahalli", Math.min(11.1, L3_LENGTH)],
    ] as [string, number][],
  },
  ...NETWORK_DATA.map((l) => ({ ...l, busRef: `Partner bus on ${l.code}` })),
].sort((a, b) => a.code.localeCompare(b.code));

function makeRoute(line: (typeof LINES)[number], reverse: boolean): Route {
  const path = reverse ? [...line.path].reverse() : line.path;
  const cum = cumulative(path);
  const length = cum[cum.length - 1];
  const raw = reverse ? [...line.stops].reverse() : line.stops;
  // Stop distances are measured on the forward path; flip them for the return direction.
  const fwdLength = cumulative(line.path).at(-1)!;
  const stops: Stop[] = raw.map(([name, km]) => {
    const d = reverse ? fwdLength - km : km;
    const [lat, lng] = interpolate(path, cum, d);
    return { id: name.toLowerCase().replace(/[^a-z]+/g, "-"), name, km: d, lat, lng };
  });
  const n = line.code.slice(1);
  return {
    key: `${line.code}${reverse ? "-r" : ""}`,
    code: line.code,
    nightCode: `N${n}`,
    name: line.name,
    busRef: line.busRef,
    path,
    cum,
    length,
    stops,
  };
}

export const ROUTES: Route[] = LINES.flatMap((l) => [makeRoute(l, false), makeRoute(l, true)]);
const BY_KEY = new Map(ROUTES.map((r) => [r.key, r]));

/** The forward direction of each line, for drawing the network once. */
export const LINE_ROUTES = ROUTES.filter((r) => !r.key.endsWith("-r"));

export function getRoute(key: string): Route {
  const r = BY_KEY.get(key);
  if (!r) throw new Error(`Unknown route ${key}`);
  return r;
}

export const pointAtKm = (route: Route, km: number): LatLng => interpolate(route.path, route.cum, km);

/** Road points between two distances, for drawing part of a route. */
export function pathBetween(route: Route, fromKm: number, toKm: number): LatLng[] {
  const inner = route.path.filter((_, i) => route.cum[i] > fromKm && route.cum[i] < toKm);
  return [pointAtKm(route, fromKm), ...inner, pointAtKm(route, toKm)];
}

/** Every place served by at least one line, A to Z. */
export const PLACES: string[] = [...new Set(LINES.flatMap((l) => l.stops.map(([n]) => n)))].sort((a, b) =>
  a.localeCompare(b, "en", { sensitivity: "base" }),
);

export interface Trip {
  route: Route;
  from: number;
  to: number;
}

/** The direct ride between two places: the shortest route that serves `from` before `to`. */
export function findTrip(from: string, to: string): Trip | null {
  let best: Trip | null = null;
  for (const route of ROUTES) {
    const i = route.stops.findIndex((s) => s.name === from);
    const j = route.stops.findIndex((s) => s.name === to);
    if (i < 0 || j <= i) continue;
    const km = route.stops[j].km - route.stops[i].km;
    if (!best || km < best.route.stops[best.to].km - best.route.stops[best.from].km) {
      best = { route, from: i, to: j };
    }
  }
  return best;
}

/** Places you can reach from `from` without changing lines. */
export function destinationsFrom(from: string): string[] {
  return PLACES.filter((p) => p !== from && findTrip(from, p) !== null);
}

export const DEFAULT_TRIP = { from: "Agara", to: "Marathahalli" };

export const tripKm = (t: { route: Route; from: number; to: number }) =>
  t.route.stops[t.to].km - t.route.stops[t.from].km;
