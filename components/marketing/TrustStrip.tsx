// Every figure here is a fact about how the system is built, not a usage
// statistic — see the product brief's "no fabricated statistics" rule.

const FACTS = [
  { figure: "4", label: "roles — patient, doctor, staff, admin — each with its own workspace" },
  { figure: "2", label: "independent guards against double-booking a slot" },
  { figure: "8 h", label: "session lifetime before you sign in again" },
  { figure: "1", label: "audit log of privileged actions, append-only" },
];

export function TrustStrip() {
  return (
    <section aria-label="What the system enforces" className="border-y border-rule bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-x-10">
          {FACTS.map((f) => (
            <div key={f.label} className="reveal border-l border-rule-strong pl-4 sm:pl-5">
              <dt className="font-mono text-3xl font-semibold tabular-nums text-ink-900 sm:text-[2.25rem]">{f.figure}</dt>
              <dd className="mt-1.5 text-sm leading-snug text-ink-500">{f.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
