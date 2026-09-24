import Link from "next/link";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/brand/Logo";
import { PageHeader } from "@/components/patient/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { ArrowLeftIcon, CheckIcon, EmergencyIcon, PhoneIcon } from "@/components/ui/Icons";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Emergency information" };

// This page is informational only. It displays contact details and does not
// contact emergency services on the visitor's behalf — the product brief is
// explicit that this application must never imply automatic dispatch it
// doesn't have. The "Call" buttons are ordinary tel: links: the visitor's own
// phone places the call.

const BEFORE_YOU_ARRIVE = [
  "Bring a photo ID and, if you have one, your patient ID card.",
  "Bring a list of current medications, or the medications themselves.",
  "If possible, have someone else drive — don't drive yourself if you're unwell.",
  "Note the time symptoms started; you'll be asked at triage.",
];

/// A tel: target must be digits and an optional leading +; anything else in
/// the stored number (spaces, dashes, brackets) is display formatting.
function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function ContactRow({ label, value, callable = false }: { label: string; value: string | null; callable?: boolean }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wider text-ink-500">{label}</dt>
        <dd className={`mt-1 ${value ? "font-mono text-lg font-semibold text-ink-900" : "text-sm text-ink-500"}`}>
          {value ?? "Not set up yet"}
        </dd>
      </div>
      {value && callable && (
        <a href={telHref(value)} className={buttonClasses({ variant: "secondary", size: "touch", className: "w-full sm:w-auto" })}>
          <PhoneIcon className="h-4 w-4" />
          Call
          <span className="sr-only"> {label}</span>
        </a>
      )}
    </div>
  );
}

export default async function EmergencyPage() {
  const [session, settings] = await Promise.all([
    getServerSession(authOptions),
    prisma.hospitalSettings.findUnique({ where: { id: 1 } }),
  ]);
  const emergencyPhone = settings?.emergencyPhone || null;
  const mainPhone = settings?.phone || null;
  const address = settings?.addressLine || null;

  const content = (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Emergency information"
        description="How to reach this hospital directly, and what to bring."
      />

      <div
        role="note"
        className="flex gap-3.5 rounded-xl border border-[var(--color-signal-stop)]/25 bg-[var(--color-signal-stop-bg)] p-4 sm:p-5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--color-signal-stop)]">
          <EmergencyIcon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[0.9375rem] font-semibold text-[var(--color-signal-stop)]">
            If this is a life-threatening emergency, call your local emergency number now.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-signal-stop)]">
            This page does not contact emergency services. It shows how to reach this hospital directly.
          </p>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-xs font-medium uppercase tracking-wider text-ink-500">Emergency department contact</h2>
      <dl className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-surface">
        <ContactRow label="Emergency line" value={emergencyPhone} callable />
        <ContactRow label="Main hospital line" value={mainPhone} callable />
        <div className="px-5 py-4">
          <dt className="text-xs font-medium uppercase tracking-wider text-ink-500">Address</dt>
          <dd className={`mt-1 ${address ? "text-[0.9375rem] font-medium text-ink-900" : "text-sm text-ink-500"}`}>
            {address ?? "Not set up yet"}
          </dd>
        </div>
      </dl>

      {!emergencyPhone && (
        <p className="mt-3 text-sm text-ink-500">
          The hospital hasn&apos;t added an emergency number yet. Use your local emergency number in an emergency.
        </p>
      )}

      <h2 className="mb-3 mt-8 text-xs font-medium uppercase tracking-wider text-ink-500">Before you arrive</h2>
      <ul className="space-y-3 rounded-xl border border-rule bg-surface p-5">
        {BEFORE_YOU_ARRIVE.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink-700">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  // Signed in: the page appears inside the application, so navigation stays put.
  if (session) return <AppShell>{content}</AppShell>;

  // Visitors without an account get the same content on the public frame.
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link href="/" aria-label="MediCare+ home" className="rounded-md">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Home
          </Link>
        </div>
      </header>
      <main className="px-5 py-10 sm:py-14">{content}</main>
    </div>
  );
}
