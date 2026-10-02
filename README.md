# Ola Hop

Concept prototype for an Associate Product Manager case submission by Sreevani Gunda. Not an official Ola product. All line data is simulated.

**Ola Hop:** shared autos, cabs and buses that run like a metro. Ola's autos, cabs and partner buses run on fixed lines, with a vehicle about every 4 minutes at peak and a fixed fare per seat (bus ₹25, auto ₹50, cab ₹80).

## Pages

- `/` Overview: the problem, how a line works, Night Line, the MVP and why Ola.
- `/demo` A guided demo on a real map of Bengaluru: hold a seat on L3 (Agara to Marathahalli), ride, arrive, then switch to Night Line. After the tour, pick any From and To across 7 lines and 29 places. The pilot is L3 only; the other lines show how a city network could look.
- `/SreevaniGunda_Ola_APM.pdf` The full PRD.

Night Line is for women riders only. The demo has a "switch rider" toggle (Priya or Arjun) that stands for who is logged in; for Arjun the Night Line switch is locked. In the product, gender comes from the profile, checked once at sign-up.

## How the demo works

There is no backend. A seeded simulation in the browser (`lib/sim.ts`) runs the chosen route: vehicles leave the first stop one headway apart, stop at each stop, pick up riders who are waiting, are held back when they bunch, and a standby vehicle is sent when a gap grows past two intervals. The numbers in "Line health" come from that simulation, warmed up from 6 am. Fares are ₹25 bus, ₹50 auto and ₹80 cab for 8 to 12 km, as in the PRD; shorter and longer bands are estimates.

- `lib/orr-path.ts`, `lib/network-data.ts` road shapes and stops for the 7 lines, traced from OpenStreetMap through the OSRM router
- `lib/network.ts` routes in both directions, places, and the From/To route finder
- `lib/sim.ts` the line simulation
- `lib/rider.ts` the rider's hold, trip and arrival
- `lib/store.ts` shared state (Zustand)
- `lib/tour.ts` the guided tour steps

Map tiles: Esri World Light Gray and Dark Gray canvas, with OpenStreetMap data.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Deploy

Push to GitHub and import the repo on Vercel. No environment variables or API keys are needed.
