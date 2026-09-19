import { SectionHeading } from "@/components/marketing/SectionHeading";
import { CheckIcon } from "@/components/ui/Icons";

const STEPS = [
  { who: "Patient", title: "Signs up and books", body: "Creates an account, picks a doctor and takes an open slot." },
  { who: "System", title: "Holds the appointment", body: "The slot is reserved and can't be double-booked. Both sides see it." },
  { who: "Doctor", title: "Sees the patient", body: "Works from the day's schedule and opens the patient's chart." },
  { who: "Doctor", title: "Records the visit", body: "Logs diagnosis and treatment, issues prescriptions, attaches documents." },
  { who: "Staff · Patient", title: "Settles the bill", body: "An invoice is raised and payments are recorded against it." },
];

const ROLES = [
  {
    title: "Patients",
    points: [
      "Book against real availability",
      "Keep appointments, prescriptions and invoices together",
      "Upload documents and message your doctor",
    ],
  },
  {
    title: "Doctors",
    points: [
      "Set weekly availability windows",
      "Record visits and issue prescriptions",
      "Open the charts of patients you treat",
    ],
  },
  {
    title: "Staff & administrators",
    points: [
      "Manage patients, doctors, departments and users",
      "Raise invoices and record payments",
      "Work from dashboards built on live numbers",
    ],
  },
];

export function Journey() {
  return (
    <section id="journey" aria-labelledby="journey-heading" className="scroll-mt-20 border-t border-rule bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <SectionHeading id="journey-heading" eyebrow="How it works" title="One visit, followed from booking to payment.">
          The same record moves between the people who need it, and each of them sees the part that is theirs.
        </SectionHeading>

        <ol className="mt-14 grid gap-9 lg:grid-cols-5 lg:gap-6">
          {STEPS.map((s, i) => {
            const last = i === STEPS.length - 1;
            return (
              <li key={s.title} className="reveal relative pl-12 lg:pl-0 lg:pt-12">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-md border border-rule-strong bg-paper font-mono text-xs font-semibold text-ink-700"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {!last && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-9 left-4 top-9 w-px bg-rule-strong lg:-right-6 lg:bottom-auto lg:left-9 lg:top-4 lg:h-px lg:w-auto"
                  />
                )}
                <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-accent-700">{s.who}</p>
                <h3 className="mt-1.5 text-base font-semibold text-ink-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{s.body}</p>
              </li>
            );
          })}
        </ol>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.title} className="reveal rounded-lg border border-rule bg-paper p-5 sm:p-6">
              <h3 className="text-base font-semibold text-ink-900">{r.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {r.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-sm leading-snug text-ink-700">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
