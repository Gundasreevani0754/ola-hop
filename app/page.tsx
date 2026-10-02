import Link from "next/link";
import type { ReactNode } from "react";

// Add the Loom link here once it is recorded; the button appears when it is set.
const LOOM_URL = "";
const PRD_URL = "/SreevaniGunda_Ola_APM.pdf";

const EVIDENCE = [
  {
    stat: "37,000 of 44,000+",
    text: "ride-hailing users had rides cancelled over their destination or digital payment.",
    source: "LocalCircles via Zee News, Jan 2024",
  },
  {
    stat: "900 of 1,800",
    text: "Sarjapur Road and ORR residents spend 1 to 2 hours a day on the road.",
    source: "Citizen Matters, Jan 2024",
  },
  {
    stat: "2,100 a day",
    text: "new vehicles added in Bengaluru, which already has 1.2 crore registered.",
    source: "Karnataka Transport Dept via News First Prime, 3 Apr 2026",
  },
];

const STEPS = [
  { n: "Plan", text: "Ola draws fixed lines with fixed stops from its own trip data. Stops sit at bus bays, off the main road." },
  { n: "Run", text: "Ola-partnered autos and cabs plus partner buses run the line, a vehicle about every 4 minutes at peak." },
  { n: "Ride", text: "The rider picks auto, cab or bus, holds a seat, and boards with a 4-digit code. The fare is fixed per seat." },
  { n: "Adapt", text: "Gaps are kept even, not clock times. Bunched vehicles are held back, and a standby is sent if a gap grows past two intervals." },
];

const FARES = [
  { type: "Bus", fare: 25, color: "var(--bus)" },
  { type: "Auto", fare: 50, color: "var(--auto)" },
  { type: "Cab", fare: 80, color: "var(--car)" },
];

const DECISION_RULE = [
  "Median peak wait of 5 minutes or less",
  "About 3,000 rides a day",
  "4 in 10 riders ride 3 or more days a week",
  "Drivers earn about 15% more per hour",
  "No serious safety incident left unresolved",
];

const WHY_OLA = [
  { title: "Its own maps", text: "Ola Maps, launched in 2024, to draw and run lines." },
  { title: "Drivers already on board", text: "10 lakh+ drivers on its zero-commission subscription, with autos at the core." },
  { title: "Hardware in the vehicle", text: "Ola Electric can build GPS and panic buttons into the vehicles themselves." },
  { title: "A reason to move first", text: "Ola is third by monthly users, so it needs a new category, not a price war." },
];

const ROADMAP = [
  { year: "2027", text: "1 line: Silk Board to Marathahalli" },
  { year: "2028", text: "3 cities: Bengaluru, Pune, Hyderabad" },
  { year: "2030", text: "10 cities, 1.5 crore users" },
  { year: "2035", text: "10 crore users across 200+ cities" },
];

const SOURCES = [
  "LocalCircles survey, reported by Zee News, Jan 2024",
  "Citizen Matters, Sarjapur Road and ORR commuter survey, Jan 2024",
  "Karnataka Transport Department, via News First Prime, 3 Apr 2026",
  "Citizen Matters, HSR Layout feeder bus, Mar 2026",
  "Watkins et al., real-time bus information and wait times, 2011",
  "MoHFW Technical Group, Population Projections 2011 to 2036, 2020",
  "MoRTH Motor Vehicle Aggregator Guidelines, 2025",
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      {/* Hero */}
      <section className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="label">APM case submission · Sreevani Gunda</p>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Shared autos, cabs and buses that run like a metro.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Ola Hop puts Ola&apos;s autos, cabs and partner buses on fixed lines, with a vehicle about
            every 4 minutes at peak and a fixed fare per seat. No waiting on the roadside, no
            haggling, no surge.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/demo" className="rounded-xl bg-accent px-5 py-3 font-bold text-on-accent">
              Try the demo
            </Link>
            <a href={PRD_URL} className="rounded-xl border border-hair bg-page px-5 py-3 font-bold">
              Read the PRD (PDF)
            </a>
            {LOOM_URL && (
              <a href={LOOM_URL} className="rounded-xl border border-hair bg-page px-5 py-3 font-bold">
                Watch the 1-minute video
              </a>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-page p-6">
          <p className="label">Line L3 · Bengaluru ORR</p>
          <p className="mt-2 font-display text-2xl font-extrabold tracking-tight">
            Silk Board → Marathahalli
          </p>
          <dl className="mt-6 space-y-4 text-sm">
            <Fact k="A vehicle every" v="4 min at peak, 8 at night" />
            <Fact k="Length" v="11.1 km, 6 stops" />
            <Fact k="Fleet for the pilot" v="40 autos and cabs, 5 partner buses" />
          </dl>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {FARES.map((f) => (
              <div key={f.type} className="rounded-2xl bg-surface p-3">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                  <span
                    className={`h-2 w-2 ${f.type === "Bus" ? "rounded-[2px]" : "rounded-full"}`}
                    style={{ background: f.color }}
                  />
                  {f.type}
                </span>
                <span className="tabular mt-1 block font-display text-2xl font-extrabold">₹{f.fare}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">Per seat, for 8 to 12 km. Never surges.</p>
        </div>
      </section>

      {/* Problem */}
      <Section label="The problem" title="Shared transport isn't short of vehicles. It's unorganised.">
        <p className="max-w-3xl text-lg leading-relaxed text-muted">
          Nobody can see an auto coming, know where it is going or trust its price. So people wait,
          haggle, and buy their own vehicle as soon as they can afford one. Every one of them adds
          another vehicle to the road.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {EVIDENCE.map((e) => (
            <figure key={e.stat} className="rounded-3xl bg-page p-6">
              <p className="tabular font-display text-3xl font-extrabold tracking-tight">{e.stat}</p>
              <p className="mt-2 leading-relaxed">{e.text}</p>
              <figcaption className="mt-4 text-xs text-muted">{e.source}</figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-4 rounded-3xl bg-accent-soft p-6">
          <p className="label">What five commuters told me</p>
          <p className="mt-2 max-w-3xl text-lg leading-relaxed">
            Four of five had slow, uncertain or overpriced trips. The only happy one had left shared
            transport and bought a vehicle.
          </p>
        </div>
      </Section>

      {/* How it works */}
      <Section label="The product" title="How a line works">
        <ol className="grid gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.n} className="rounded-3xl bg-page p-6">
              <span className="tabular text-sm font-semibold text-muted">0{i + 1}</span>
              <p className="mt-1 font-display text-xl font-extrabold">{s.n}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-3xl leading-relaxed text-muted">
          Why ₹50 for an auto: a full auto carries 3 riders and earns ₹150, about one solo fare,
          while each rider pays a third. Only Ola-partnered drivers with an Ola-installed GPS unit
          and panic button run a line.
        </p>
      </Section>

      {/* Night Line */}
      <section className="night py-14">
        <div className="grid gap-8 rounded-3xl bg-page p-6 sm:p-10 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="label">After 8 pm</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
              The same line becomes <span className="text-accent">Night Line</span>
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              Not a separate product. A switch on the line Priya already uses, from 8 pm to 6 am.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              "Women riders and women drivers only",
              "Lit, audited stops only",
              "Every ride shared live with family",
              "A 'reached home?' check, then an alert to family",
              "Route guard if a vehicle leaves its line",
              "SOS to Ola's 24×7 safety team and the police",
            ].map((t) => (
              <li key={t} className="rounded-2xl bg-accent-soft px-4 py-3 text-[15px] font-semibold">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Proof */}
      <Section label="Why it can work" title="Organised routes get used">
        <div className="grid gap-4 md:grid-cols-2">
          <Proof
            stat="300 → 6,000+"
            text="riders a day on the HSR Layout feeder bus at ₹10, once it ran a fixed, frequent route."
            source="Citizen Matters, Mar 2026"
          />
          <Proof
            stat="9.9 → 7.5 min"
            text="average wait once riders could see buses coming in real time."
            source="Watkins et al., 2011"
          />
        </div>
      </Section>

      {/* MVP */}
      <Section label="The MVP" title="One line, twelve weeks">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-3xl bg-page p-6 sm:p-8">
            <p className="leading-relaxed text-muted">
              L3 on Bengaluru&apos;s Outer Ring Road, from Silk Board to Marathahalli, with Night
              Line in the evenings. About 40 Ola autos and cabs (12 with women drivers) and 5 partner
              buses. The ORR has 8 to 10 lakh employees and no metro open yet.
            </p>
            <p className="label mt-8">North star</p>
            <p className="mt-2 font-display text-2xl font-extrabold leading-snug tracking-tight">
              Daily rides where the rider waited 5 minutes or less
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              It can&apos;t be gamed: adding riders faster than vehicles pushes waits up.
            </p>
          </div>
          <div className="rounded-3xl bg-page p-6 sm:p-8">
            <p className="label">Scale if, by week 12</p>
            <ul className="mt-4 space-y-3">
              {DECISION_RULE.map((r) => (
                <li key={r} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 h-2 w-2 flex-none rounded-full bg-accent" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">Otherwise fix and rerun, or stop.</p>
          </div>
        </div>
      </Section>

      {/* Why Ola */}
      <Section label="Why Ola" title="Ola already has the pieces">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_OLA.map((w) => (
            <div key={w.title} className="rounded-3xl bg-page p-6">
              <p className="font-display text-lg font-extrabold">{w.title}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{w.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Road to 10 crore */}
      <Section label="Getting to 10 crore" title="From one line to 200+ cities">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROADMAP.map((r) => (
            <li key={r.year} className="rounded-3xl bg-page p-6">
              <p className="tabular font-display text-3xl font-extrabold text-accent">{r.year}</p>
              <p className="mt-2 leading-relaxed">{r.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-3xl leading-relaxed text-muted">
          10 crore is about 1 in 6 city residents in 2036. It needs about 30 lakh Ola autos and cabs
          and 1 lakh partner buses. Supply is the part I am least sure of, which is why the pilot
          measures driver earnings per hour.
        </p>
      </Section>

      {/* Closing CTA */}
      <section className="py-14">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-accent p-8 text-on-accent sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight">See the line running</h2>
            <p className="mt-2 opacity-85">A 2-minute guided demo on the real ORR map, with simulated data.</p>
          </div>
          <Link href="/demo" className="rounded-xl bg-page px-5 py-3 font-bold text-fg">
            Try the demo
          </Link>
        </div>
      </section>

      {/* Sources */}
      <section className="pb-6">
        <p className="label">Sources</p>
        <ol className="mt-3 grid list-decimal gap-x-8 gap-y-1 pl-5 text-xs text-muted sm:grid-cols-2">
          {SOURCES.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted">
          Fares, fleet sizes and the growth path are my estimates. The full list of 20 sources is in
          the PRD.
        </p>
      </section>
    </div>
  );
}

function Section({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <section className="py-14">
      <p className="label">{label}</p>
      <h2 className="mt-2 max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-hair pb-3">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-semibold">{v}</dd>
    </div>
  );
}

function Proof({ stat, text, source }: { stat: string; text: string; source: string }) {
  return (
    <figure className="rounded-3xl bg-page p-6 sm:p-8">
      <p className="tabular font-display text-4xl font-extrabold tracking-tight">{stat}</p>
      <p className="mt-3 text-lg leading-relaxed">{text}</p>
      <figcaption className="mt-4 text-xs text-muted">{source}</figcaption>
    </figure>
  );
}
