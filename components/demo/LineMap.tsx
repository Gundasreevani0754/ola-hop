"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useSyncExternalStore } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { LINE, pathBetween, pointAtKm, STOPS } from "@/lib/line";
import { ORR_PATH } from "@/lib/orr-path";
import { tripProgress } from "@/lib/rider";
import { TYPES } from "@/lib/sim";
import { useHop } from "@/lib/store";
import type { VehicleType } from "@/lib/types";

// Esri's grey canvas basemaps: calm, no API key, free for non-commercial use with attribution.
const TILES = {
  light: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  dark: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
};
const ATTRIBUTION =
  'Tiles &copy; Esri · Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const BOUNDS = L.latLngBounds(ORR_PATH);

// Leaflet icons are DOM templates; reuse them so markers aren't rebuilt every tick.
const iconCache = new Map<string, L.DivIcon>();
function cachedIcon(key: string, make: () => L.DivIcon) {
  let icon = iconCache.get(key);
  if (!icon) {
    icon = make();
    iconCache.set(key, icon);
  }
  return icon;
}

const vehicleIcon = (type: VehicleType, mine: boolean, dim: boolean) =>
  cachedIcon(`v-${type}-${mine}-${dim}`, () =>
    L.divIcon({
      className: "veh-marker",
      html: `<span class="veh veh-${type}${mine ? " veh-mine" : ""}${dim ? " veh-dim" : ""}"></span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    }),
  );

const stopIcon = (name: string, me: boolean, above: boolean) =>
  cachedIcon(`s-${name}-${me}-${above}`, () =>
    L.divIcon({
      className: "stop-marker",
      html: `<span class="stop-dot${me ? " me" : ""}"></span><span class="stop-name ${above ? "above" : "below"}${me ? " me" : ""}">${me ? `${name} · you` : name}</span>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    }),
  );

function subscribeDark(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

/** Re-fit when the container changes size (phone rotation, layout shifts). */
function FitOnResize() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    let last = "";
    const ro = new ResizeObserver(([entry]) => {
      const size = `${Math.round(entry.contentRect.width)}x${Math.round(entry.contentRect.height)}`;
      if (size === last) return;
      last = size;
      map.invalidateSize({ animate: false });
      map.fitBounds(BOUNDS, { padding: [28, 28], animate: false });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

export default function LineMap() {
  const world = useHop((s) => s.world);
  const rider = useHop((s) => s.rider);
  const dark = useSyncExternalStore(subscribeDark, getDark, () => false);
  const tiles = dark || world.night ? "dark" : "light";

  const mineId = rider.hold?.vehicleId ?? (rider.view === "trip" ? rider.trip?.vehicleId : undefined);
  const riderKm = STOPS[LINE.riderStop].km;
  const destKm = STOPS[LINE.destStop].km;
  const travelledKm =
    rider.view === "trip" && rider.trip
      ? riderKm + tripProgress(world, rider.trip) * (destKm - riderKm)
      : null;

  return (
    <MapContainer
      bounds={BOUNDS}
      boundsOptions={{ padding: [28, 28] }}
      scrollWheelZoom={false}
      maxZoom={16}
      zoomSnap={0.25}
      className={`h-full w-full ${tiles === "dark" ? "map-dark" : ""}`}
      aria-label={`Map of the ${LINE.code} line on the Outer Ring Road`}
    >
      <TileLayer key={tiles} url={TILES[tiles]} attribution={ATTRIBUTION} maxZoom={16} />
      <FitOnResize />

      <Polyline positions={ORR_PATH} pathOptions={{ className: "route-base", weight: 6 }} />
      <Polyline
        positions={pathBetween(riderKm, destKm)}
        pathOptions={{ className: "route-mine", weight: 6 }}
      />
      {travelledKm !== null && travelledKm > riderKm && (
        <Polyline
          positions={pathBetween(riderKm, travelledKm)}
          pathOptions={{ className: "route-done", weight: 6 }}
        />
      )}

      {STOPS.map((s, i) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={stopIcon(s.name, i === LINE.riderStop, i % 2 === 1)}
          keyboard={false}
          interactive={false}
        />
      ))}

      {world.vehicles
        .filter((v) => v.posKm >= 0)
        .map((v) => {
          const mine = v.id === mineId;
          const dim = !mine && rider.filter !== "all" && v.type !== rider.filter;
          return (
            <Marker
              key={v.id}
              position={pointAtKm(v.posKm)}
              icon={vehicleIcon(v.type, mine, dim)}
              zIndexOffset={mine ? 1000 : 0}
              title={`${TYPES[v.type].label} ${v.plate}`}
              keyboard={false}
            />
          );
        })}
    </MapContainer>
  );
}
