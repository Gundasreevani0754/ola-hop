# Ola Hop

Concept prototype for an Associate Product Manager case submission by Sreevani Gunda. Not an official Ola product. All line data is simulated.

**Ola Hop:** shared autos, cabs and buses that run like a metro. Ola's autos, cabs and partner buses run on fixed lines, with a vehicle about every 4 minutes at peak and a fixed fare per seat (bus ₹25, auto ₹50, cab ₹80).

## Pages

- `/` Overview: the problem, how a line works, Night Line, the MVP and why Ola.
- `/demo` A guided demo of line L3 (Silk Board to Marathahalli) on a real map of Bengaluru's Outer Ring Road: hold a seat, ride, arrive, then switch to Night Line. After the tour, everything is clickable.
- `/SreevaniGunda_Ola_APM.pdf` The full PRD.

## How the demo works

There is no backend. A seeded simulation in the browser (`lib/sim.ts`) runs the line: vehicles leave Silk Board one headway apart, stop at each stop, pick up riders who are waiting, are held back when they bunch, and a standby vehicle is sent when a gap grows past two intervals. The numbers in "Line health" come from that simulation, warmed up from 6 am.

- `lib/orr-path.ts` the ORR road shape, traced from OpenStreetMap through the OSRM router
- `lib/line.ts` stops and distance along the line
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
