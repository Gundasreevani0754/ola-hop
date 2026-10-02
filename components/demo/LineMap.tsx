"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  ZoomControl,
} from "react-leaflet";
import { getRoute, LINE_ROUTES, pathBetween, pointAtKm, type Route } from "@/lib/network";
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
const ALL_BOUNDS = L.latLngBounds(LINE_ROUTES.flatMap((r) => r.path));

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

type StopRole = "from" | "to" | "on" | "off";
const stopIcon = (name: string, role: StopRole, above: boolean, labelled: boolean) =>
  cachedIcon(`s-${name}-${role}-${above}-${labelled}`, () => {
    const label = role === "from" ? `${name} · you` : role === "to" ? `${name} · drop` : name;
    const text = labelled ? `<span class="stop-name ${above ? "above" : "below"} ${role}">${label}</span>` : "";
    return L.divIcon({
      className: "stop-marker",
      html: `<span class="stop-dot ${role}"></span>${text}`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  });

function subscribeDark(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

const NARROW = "(max-width: 640px)";
function subscribeNarrow(cb: () => void) {
  const mq = window.matchMedia(NARROW);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getNarrow = () => window.matchMedia(NARROW).matches;

/** Fit the chosen route (or the whole network), and again whenever the box changes size. */
function FitView({ route, mode }: { route: Route; mode: "line" | "all" }) {
  const map = useMap();
  useEffect(() => {
    const fit = () => {
      map.invalidateSize({ animate: false });
      const bounds = mode === "all" ? ALL_BOUNDS : L.latLngBounds(route.path);
      // Room for the route header on top, the legend below, and stop labels at the sides.
      // On narrow screens the header and view switch stack, so leave more at the top.
      const small = map.getContainer().clientWidth < 520;
      map.fitBounds(bounds, {
        paddingTopLeft: [small ? 72 : 48, small ? 132 : 96],
        paddingBottomRight: [small ? 72 : 48, small ? 40 : 64],
        animate: false,
      });
    };
    fit();
    let last = "";
    const ro = new ResizeObserver(([entry]) => {
      const size = `${Math.round(entry.contentRect.width)}x${Math.round(entry.contentRect.height)}`;
      if (size === last) return;
      last = size;
      fit();
    });
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map, route, mode]);
  return null;
}

export default function LineMap() {
  const world = useHop((s) => s.world);
  const rider = useHop((s) => s.rider);
  const [mode, setMode] = useState<"line" | "all">("line");
  const dark = useSyncExternalStore(subscribeDark, getDark, () => false);
  const narrow = useSyncExternalStore(subscribeNarrow, getNarrow, () => false);
  const tiles = dark || world.night ? "dark" : "light";

  const route = getRoute(world.routeKey);
  const fromKm = route.stops[rider.from].km;
  const toKm = route.stops[rider.to].km;
  const mineId = rider.hold?.vehicleId ?? (rider.view === "trip" ? rider.trip?.vehicleId : undefined);
  const travelledKm =
    rider.view === "trip" && rider.trip ? fromKm + tripProgress(world, rider, rider.trip) * (toKm - fromKm) : null;
  const code = world.night ? route.nightCode : route.code;
  const first = route.stops[0].name;
  const last = route.stops[route.stops.length - 1].name;
  const others = LINE_ROUTES.filter((r) => r.code !== route.code);

  return (
    <div className={`relative h-full w-full ${tiles === "dark" ? "map-dark" : ""}`}>
      <MapContainer
        bounds={L.latLngBounds(route.path)}
        boundsOptions={{ paddingTopLeft: [36, 96], paddingBottomRight: [36, 64] }}
        scrollWheelZoom={false}
        zoomControl={false}
        maxZoom={16}
        zoomSnap={0.25}
        className="h-full w-full"
        aria-label={`Map of ${code}, ${first} to ${last}`}
      >
        <TileLayer key={tiles} url={TILES[tiles]} attribution={ATTRIBUTION} maxZoom={16} />
        <ZoomControl position="bottomright" />
        <FitView route={route} mode={mode} />

        {/* The rest of the network, quiet, so the chosen route stands out. */}
        {others.map((r) => (
          <Polyline key={r.key} positions={r.path} className="net-line" weight={4}>
            <Tooltip sticky>
              {r.code} {r.name}
            </Tooltip>
          </Polyline>
        ))}
        {others.flatMap((r) =>
          r.stops.map((s) => (
            <CircleMarker
              key={`${r.key}-${s.id}`}
              center={[s.lat, s.lng]}
              radius={3.5}
              className="net-stop"
              weight={2}
            >
              <Tooltip direction="top" offset={[0, -4]}>
                {s.name} · {r.code}
              </Tooltip>
            </CircleMarker>
          )),
        )}

        {/* className must be a prop, not pathOptions: Leaflet only reads it when the path is created. */}
        <Polyline key={`base-${route.key}`} positions={route.path} className="route-base" weight={6} />
        <Polyline
          key={`mine-${route.key}`}
          positions={pathBetween(route, fromKm, toKm)}
          className="route-mine"
          weight={6}
        />
        {travelledKm !== null && travelledKm > fromKm && (
          <Polyline
            key={`done-${route.key}`}
            positions={pathBetween(route, fromKm, travelledKm)}
            className="route-done"
            weight={6}
          />
        )}

        {route.stops.map((s, i) => {
          const role: StopRole =
            i === rider.from ? "from" : i === rider.to ? "to" : i > rider.from && i < rider.to ? "on" : "off";
          return (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              // Zoomed out, or on a phone, only the rider's two stops keep a label.
              icon={stopIcon(s.name, role, i % 2 === 1, (mode === "line" && !narrow) || role === "from" || role === "to")}
              keyboard={false}
              interactive={false}
              zIndexOffset={role === "from" || role === "to" ? 500 : 0}
            />
          );
        })}

        {world.vehicles
          .filter((v) => v.posKm >= 0)
          .map((v) => {
            const mine = v.id === mineId;
            const dim = !mine && rider.filter !== "all" && v.type !== rider.filter;
            return (
              <Marker
                key={v.id}
                position={pointAtKm(route, v.posKm)}
                icon={vehicleIcon(v.type, mine, dim)}
                zIndexOffset={mine ? 1000 : 0}
                title={`${TYPES[v.type].label} ${v.plate}`}
                keyboard={false}
              />
            );
          })}
      </MapContainer>

      {/* Route header and view switch, above the map panes. */}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex flex-wrap items-start justify-between gap-2">
        <div className="pointer-events-auto max-w-[70%] rounded-2xl bg-page/95 px-3.5 py-2.5 shadow-sm backdrop-blur">
          <p className="flex items-center gap-2 text-sm font-bold">
            <span className="rounded-md bg-accent px-1.5 py-0.5 font-display text-xs font-extrabold text-on-accent">
              {code}
            </span>
            {route.name}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {first} → {last} · {route.length.toFixed(1)} km
            {route.code === "L3" ? " · pilot line" : " · network concept"}
          </p>
        </div>
        <div
          role="group"
          aria-label="Map view"
          className="pointer-events-auto grid grid-cols-2 gap-0.5 rounded-xl bg-page/95 p-[3px] text-xs font-semibold shadow-sm backdrop-blur"
        >
          {(
            [
              ["line", "This line"],
              ["all", "All lines"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-[9px] px-2.5 py-1.5 ${mode === m ? "bg-accent text-on-accent" : "text-muted hover:text-fg"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <ul className="pointer-events-none absolute bottom-3 left-3 z-[1000] hidden max-w-[calc(100%-5rem)] flex-wrap sm:flex gap-x-3 gap-y-1 rounded-xl bg-page/95 px-3 py-2 text-[11px] font-semibold text-muted shadow-sm backdrop-blur">
        {(["auto", "car", "bus"] as const).map((t) => (
          <li key={t} className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 ${t === "bus" ? "rounded-[3px]" : "rounded-full"}`}
              style={{ background: `var(--${t})` }}
            />
            {TYPES[t].label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-accent bg-page" />
          Your stops
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-1 w-4 rounded" style={{ background: "var(--muted)", opacity: 0.45 }} />
          Other lines
        </li>
      </ul>
    </div>
  );
}
