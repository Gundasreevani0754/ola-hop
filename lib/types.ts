export type VehicleType = "auto" | "car" | "bus";
export type Filter = "all" | VehicleType;

export type VehicleStatus = "approaching" | "atStop" | "full" | "standby";

export interface Vehicle {
  id: number;
  type: VehicleType;
  /** Distance along the line from Silk Board, in km. */
  posKm: number;
  /** Free seats right now. */
  seats: number;
  capacity: number;
  woman: boolean;
  driverName: string;
  plate: string;
  status: VehicleStatus;
  /** Index of the last stop this vehicle served (-1 before Silk Board). */
  lastStop: number;
  /** Simulated minutes left at the current stop. */
  dwellLeft: number;
  /** Extra minutes held back at a stop to keep gaps even. */
  holdLeft: number;
  /** Traffic factor on cruise speed, drifts between 0.75 and 1.2. */
  traffic: number;
  /** Sent from standby to fill a gap. */
  standby: boolean;
}

export interface Stop {
  id: string;
  name: string;
  km: number;
  lat: number;
  lng: number;
}

export type SimEventKind = "hold" | "standby";

export interface SimEvent {
  id: number;
  t: number;
  kind: SimEventKind;
  text: string;
  vehicleId?: number;
}

export interface Metrics {
  /** Rides boarded since the sim started. */
  rides: number;
  /** Of those, rides where the rider waited 5 min or less. */
  ridesWait5: number;
  /** Recent waits in simulated minutes (most recent last, capped). */
  recentWaits: number[];
  /** Fares collected, in rupees, by vehicle type. */
  fares: Record<VehicleType, number>;
  /** Simulated minutes vehicles of each type spent on the line. */
  vehicleMinutes: Record<VehicleType, number>;
}

export interface World {
  /** Which route and direction this world runs (see lib/network.ts). */
  routeKey: string;
  /** The stop the rider waits at, used to place the first vehicle. */
  riderStop: number;
  night: boolean;
  /** Simulated minutes since midnight. */
  t: number;
  rngState: number;
  vehicles: Vehicle[];
  nextId: number;
  /** Simulated minutes since the last vehicle left Silk Board. */
  sinceSpawn: number;
  /** Minutes before another standby vehicle can be sent. */
  standbyCooldown: number;
  /** Arrival times of riders waiting at each stop. */
  queues: number[][];
  metrics: Metrics;
  events: SimEvent[];
  nextEventId: number;
}
