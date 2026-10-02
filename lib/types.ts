export type VehicleType = "auto" | "car" | "bus";
export type Filter = "all" | VehicleType;

export type VehicleStatus =
  | "approaching"
  | "atStop"
  | "full"
  | "delayed"
  | "standby";

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
  /** Minutes left stuck in a breakdown or jam. */
  delayLeft: number;
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

export type SimEventKind = "hold" | "standby" | "delay" | "full" | "info";

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
  /** Recent waits per stop, same order as STOPS. */
  waitsByStop: number[][];
}

export interface World {
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
