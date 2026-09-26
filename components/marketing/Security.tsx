import type { ReactNode } from "react";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { ClockIcon, IdCardIcon, KeyIcon, LockIcon, RecordIcon, ShieldIcon } from "@/components/ui/Icons";

// Every line describes a control that exists in this codebase (see lib/auth.ts,
// lib/rate-limit.ts, lib/audit.ts). No certification or compliance claim is
// made anywhere on the page, deliberately.

const CONTROLS: Array<{ icon: ReactNode; title: string; body: string }> = [
  {
    icon: <ShieldIcon />,
    title: "Access enforced on the server",
    body: "Every API route checks the caller's role itself. Hiding a button in the interface is never the only protection.",
  },
  {
    icon: <IdCardIcon />,
    title: "Charts follow relationships",
    body: "Patients open their own chart. Doctors open the charts of patients they treat. Staff and administrators manage the rest.",
  },
  {
    icon: <KeyIcon />,
    title: "Passwords, handled carefully",
    body: "Hashed with bcrypt and never returned by any endpoint. At least ten characters, with upper and lower case and a number.",
  },
  {
    icon: <LockIcon />,
    title: "Sign-in protection",
    body: "Sign-in and registration are rate-limited per account and per address. A failed sign-in doesn't reveal whether an email is registered.",
  },
  {
    icon: <ClockIcon />,
    title: "Sessions that end",
    body: "A session lasts eight hours, then you sign in again.",
  },
  {
    icon: <RecordIcon />,
    title: "An audit trail",
    body: "Privileged actions are written to an append-only audit log.",
  },
];

export function Security() {
  return (
    <section id="security" aria-labelledby="security-heading" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="relative overflow-hidden rounded-xl bg-panel px-6 py-12 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="bg-grid-dark absolute inset-0" />
            <div className="glow-accent-dark absolute -left-24 -top-24 h-[28rem] w-[28rem]" />
          </div>

          <div className="relative grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-16">
            <SectionHeading
              id="security-heading"
              tone="dark"
              eyebrow="Security"
              title="Built so access is decided in one place: the server."
            >
              Health records deserve more than a login screen. These are the controls the application
              actually implements today.
            </SectionHeading>

            <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {CONTROLS.map((c) => (
                <li key={c.title} className="reveal flex gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/[0.06] text-accent-400">
                    {c.icon}
                  </span>
                  <div>
                    <h3 className="text-[0.9375rem] font-semibold text-white">{c.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/65">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
