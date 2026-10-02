import Link from "next/link";

// Phase 0 placeholder. The full landing page comes in Phase 2.
export default function Home() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16">
      <p className="label">Concept for 2035 · Bengaluru first</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
        Shared autos, cabs and buses that run like a metro.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">
        Shared transport in Indian cities is not short of vehicles. It is unorganised. Ola Hop runs
        Ola autos, cabs and partner buses on fixed lines, with a vehicle every 4 minutes at peak and
        a fixed fare per seat.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/rider" className="rounded-xl bg-accent px-5 py-3 font-bold text-on-accent">
          Try the demo
        </Link>
        <a
          href="/SreevaniGunda_Ola_APM.pdf"
          className="rounded-xl border border-hair px-5 py-3 font-bold"
        >
          Read the PRD (PDF)
        </a>
      </div>
    </section>
  );
}
