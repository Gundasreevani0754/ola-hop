import { DEFAULT_TRIP } from "./network";
import { upcoming } from "./sim";
import { useHop, type HopState } from "./store";

export interface TourStep {
  title: string;
  body: string;
  /** Runs when the tour moves onto this step. */
  enter?: (s: HopState) => void;
  /** The Next button waits until this is true. */
  ready?: (s: HopState) => boolean;
  /** Shown on the Next button while waiting. */
  waiting?: string;
}

export const TOUR: TourStep[] = [
  {
    title: "Priya is at Agara",
    body: "8:24 am on the Outer Ring Road. Before she leaves her desk, Priya can see when the next auto, cab or bus reaches her stop, how many seats are free, and the fixed fare. No standing on the roadside, no haggling.",
  },
  {
    title: "One tap holds her seat",
    body: "She gets a 4-digit boarding code and a police-verified driver. The seat is kept until 60 seconds after the auto reaches the stop.",
    enter: (s) => {
      // Restart on L3 so Lakshmi's auto is the one a minute away, whatever happened before.
      s.selectTrip(DEFAULT_TRIP.from, DEFAULT_TRIP.to);
      const { world, rider, holdSeat } = useHop.getState();
      const next = upcoming(world, rider.from, "all").find((x) => x.v.seats > 0);
      if (next) holdSeat(next.v.id, "4729");
    },
  },
  {
    title: "The auto waits for her",
    body: "Lakshmi's auto reaches Agara and waits up to 60 seconds. If Priya misses it, the seat goes back and the next vehicle is about 4 minutes behind.",
    enter: (s) => s.skipAhead(),
    ready: (s) => s.rider.view !== "held" || s.rider.hold?.arrivedAt !== null,
    waiting: "Auto on its way",
  },
  {
    title: "A ride on a fixed line",
    body: "The auto follows the line's fixed route. A route guard alerts Ola's 24×7 safety team if it leaves the line, and SOS reaches the safety team and the police.",
    enter: (s) => s.board(),
    ready: (s) => s.rider.view === "arrived" || s.rider.view === "home",
    waiting: "Riding to Marathahalli",
  },
  {
    title: "₹50, every day",
    body: "8.7 km to Marathahalli for a fixed ₹50 that never surges. A full auto earns Lakshmi ₹150, about one solo fare, while each rider pays a third.",
  },
  {
    title: "The line behind the app",
    body: "The map and numbers show the line itself. Vehicles leave every 4 minutes, are held back when they bunch, and a standby is sent if a gap opens. The number Ola watches: rides where the wait was 5 minutes or less.",
    enter: (s) => s.finishRide(),
  },
  {
    title: "After 8 pm: Night Line",
    body: "The same line switches to Night Line: women riders and women drivers only, lit stops, every ride shared live with family, and a 'reached home?' check. It only turns on for women riders, from the profile checked at sign-up. Switch the demo rider to Arjun and it locks.",
    enter: (s) => {
      s.setProfile("woman");
      useHop.getState().setNight(true);
    },
  },
  {
    title: "Your turn",
    body: "Pick any From and To across 7 lines in Bengaluru, switch vehicle types, hold a seat, or see what happens when a vehicle arrives full. The pilot runs L3 only; the other lines show how a city network could look.",
    enter: (s) => s.setNight(false),
  },
];
