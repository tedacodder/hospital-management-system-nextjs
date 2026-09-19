import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { delay } from "@/components/brand/motion";
import { Badge } from "@/components/ui/Badge";
import {
  CalendarIcon,
  IdCardIcon,
  PaperclipIcon,
  PillIcon,
  ReceiptIcon,
  ShieldIcon,
} from "@/components/ui/Icons";
import type { ReactNode } from "react";

export type AuthVariant = "login" | "signup";

export const AUTH_COPY: Record<AuthVariant, { eyebrow: string; title: string; body: string }> = {
  login: {
    eyebrow: "Welcome back",
    title: "Your care, exactly where you left it.",
    body: "Sign in to your appointments, prescriptions and invoices — or to your schedule and patients, if you're on the clinical team.",
  },
  signup: {
    eyebrow: "New patient",
    title: "Your record starts here.",
    body: "Create a patient account to book open slots, keep visits and prescriptions together, and see exactly what you owe.",
  },
};

// Sample content only — see the note on the landing page's HeroBoard.

function TimelineCard() {
  const events: Array<{ icon: ReactNode; title: string; meta: string; badge: ReactNode }> = [
    { icon: <CalendarIcon />, title: "Appointment", meta: "Cardiology · Monday 10:00", badge: <Badge tone="info">Confirmed</Badge> },
    { icon: <PillIcon />, title: "Prescription", meta: "Amlodipine 5 mg · 30 days", badge: <Badge tone="info">Active</Badge> },
    { icon: <ReceiptIcon />, title: "Invoice", meta: "INV-2026-000031 · ETB 1,200.00", badge: <Badge tone="ok">Paid</Badge> },
  ];
  return (
    <div className="rounded-xl border border-white/10 bg-ink-800/80 p-5 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.5)] backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">Care timeline</p>
        <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-white/45">Sample data</span>
      </div>
      <ol className="mt-4 space-y-0">
        {events.map((e, i) => (
          <li key={e.title} className="relative flex gap-3.5 pb-5 last:pb-0">
            {i < events.length - 1 && (
              <span aria-hidden="true" className="absolute left-[15px] top-9 bottom-0 w-px bg-white/15" />
            )}
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/[0.06] text-accent-400 [&>svg]:h-4 [&>svg]:w-4">
              {e.icon}
            </span>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{e.title}</p>
                <p className="truncate font-mono text-xs text-white/55">{e.meta}</p>
              </div>
              {e.badge}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RecordCard() {
  const rows: Array<{ icon: ReactNode; title: string; body: string }> = [
    { icon: <CalendarIcon />, title: "Appointments", body: "Book against a doctor's open slots" },
    { icon: <PillIcon />, title: "Prescriptions", body: "Issued by your doctor, kept in order" },
    { icon: <ReceiptIcon />, title: "Invoices", body: "Itemised, with the payment history" },
    { icon: <PaperclipIcon />, title: "Documents", body: "PDF, PNG, JPEG or WebP up to 15 MB" },
  ];
  return (
    <div className="rounded-xl border border-white/10 bg-ink-800/80 p-5 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.5)] backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-white/70">
          <IdCardIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-medium text-white">Your patient record</p>
          <p className="font-mono text-xs text-white/55">P-000000 · assigned when you sign up</p>
        </div>
      </div>
      <ul className="mt-4 space-y-3.5">
        {rows.map((r) => (
          <li key={r.title} className="flex items-center gap-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/[0.06] text-accent-400 [&>svg]:h-4 [&>svg]:w-4">
              {r.icon}
            </span>
            <div>
              <p className="text-sm font-medium text-white">{r.title}</p>
              <p className="text-xs text-white/55">{r.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/// The dark brand half of the split auth layout. Shown from lg upward; below
/// that the layout uses a compact band instead (see AuthShell).
export function AuthBrandPanel({ variant }: { variant: AuthVariant }) {
  const copy = AUTH_COPY[variant];
  return (
    <aside className="relative hidden overflow-hidden bg-ink-900 text-white lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10 xl:px-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-grid-dark absolute inset-0" />
        <div className="glow-accent-dark absolute -left-32 -top-32 h-[34rem] w-[34rem]" />
        <div className="glow-accent-dark absolute -bottom-48 right-[-8rem] h-[30rem] w-[30rem] opacity-60" />
      </div>

      <div className="relative">
        <Link
          href="/"
          aria-label="MediCare+ home"
          className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        >
          <Logo tone="dark" />
        </Link>
      </div>

      <div className="relative my-12 max-w-lg">
        <p className="animate-rise font-mono text-[0.6875rem] uppercase tracking-wider text-accent-400" style={delay(0)}>
          {copy.eyebrow}
        </p>
        <p
          className="animate-rise mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] xl:text-[2.75rem]"
          style={delay(60)}
        >
          {copy.title}
        </p>
        <p className="animate-rise mt-4 text-base leading-relaxed text-white/70" style={delay(120)}>
          {copy.body}
        </p>

        <div className="animate-rise mt-10" style={delay(220)}>
          <div className="animate-float">{variant === "login" ? <TimelineCard /> : <RecordCard />}</div>
        </div>
      </div>

      <p className="relative flex items-start gap-2.5 text-sm leading-snug text-white/60">
        <ShieldIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent-400" />
        Passwords are hashed and never shown back to you. Sign-in attempts are rate-limited.
      </p>
    </aside>
  );
}
