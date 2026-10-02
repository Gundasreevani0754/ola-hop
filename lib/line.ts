import { ORR_PATH } from "./orr-path";
import type { Stop } from "./types";

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Cumulative km at each point of ORR_PATH. */
const CUM_KM: number[] = ORR_PATH.reduce<number[]>((acc, p, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + haversineKm(ORR_PATH[i - 1], p));
  return acc;
}, []);

export const LINE_LENGTH_KM = CUM_KM[CUM_KM.length - 1];

/** Lat/lng of the point `km` along the line, clamped to its ends. */
export function pointAtKm(km: number): [number, number] {
  if (km <= 0) return ORR_PATH[0];
  if (km >= LINE_LENGTH_KM) return ORR_PATH[ORR_PATH.length - 1];
  let lo = 0;
  let hi = CUM_KM.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (CUM_KM[mid] <= km) lo = mid;
    else hi = mid;
  }
  const t = (km - CUM_KM[lo]) / (CUM_KM[hi] - CUM_KM[lo] || 1);
  const a = ORR_PATH[lo];
  const b = ORR_PATH[hi];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Road points between two distances, for drawing part of the line. */
export function pathBetween(fromKm: number, toKm: number): [number, number][] {
  const inner = ORR_PATH.filter((_, i) => CUM_KM[i] > fromKm && CUM_KM[i] < toKm);
  return [pointAtKm(fromKm), ...inner, pointAtKm(toKm)];
}

// Stop distances come from projecting each place onto the traced road.
// HSR sits where the ORR runs along HSR Layout, before Agara Lake.
const STOP_KM: [string, string, number][] = [
  ["silk", "Silk Board", 0],
  ["hsr", "HSR", 1.1],
  ["agara", "Agara", 2.4],
  ["bellandur", "Bellandur", 7.0],
  ["kadu", "Kadubeesanahalli", 9.0],
  ["marathahalli", "Marathahalli", Math.min(11.1, LINE_LENGTH_KM)],
];

export const STOPS: Stop[] = STOP_KM.map(([id, name, km]) => {
  const [lat, lng] = pointAtKm(km);
  return { id, name, km, lat, lng };
});

export const LINE = {
  code: "L3",
  nightCode: "N3",
  name: "ORR Line",
  /** The demo rider boards at Agara and gets off at Marathahalli. */
  riderStop: 2,
  destStop: STOPS.length - 1,
} as const;

export const LAST_STOP = STOPS.length - 1;
