import type { ReactNode } from "react";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import {
  BellIcon,
  CalendarIcon,
  MessageIcon,
  PaperclipIcon,
  PillIcon,
  ReceiptIcon,
  RecordIcon,
  UsersIcon,
} from "@/components/ui/Icons";

// Each tile pairs one real capability with a small drawing of it in the
// product's own visual language. All sample content is invented and is not
// presented as live data.

function Tile({
  icon,
  title,
  children,
  visual,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  visual: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`reveal group flex flex-col rounded-lg border border-rule bg-surface p-5 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-rule-strong hover:shadow-[var(--shadow-card)] sm:p-6 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-050 text-accent-700">{icon}</span>
        <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-700">{children}</p>
      <div
        aria-hidden="true"
        className="mt-5 flex-1 rounded-md border border-rule bg-paper p-3.5 select-none"
      >
        {visual}
      </div>
    </article>
  );
}

const slot = "flex h-7 items-center justify-center rounded-sm border font-mono text-xs";
const open = `${slot} border-rule-strong bg-white text-ink-900`;
const taken = `${slot} border-transparent bg-ink-900/[0.04] text-ink-300 line-through`;

function AppointmentsVisual() {
  const rows: Array<{ name: string; dept: string; slots: Array<[string, boolean]> }> = [
    { name: "Dr. Okafor", dept: "Cardiology", slots: [["09:00", true], ["09:30", false], ["10:00", false], ["10:30", true], ["11:00", false]] },
    { name: "Dr. Haile", dept: "General practice", slots: [["09:00", false], ["09:30", false], ["10:00", true], ["10:30", false], ["11:00", true]] },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.name} className="grid items-center gap-2 sm:grid-cols-[9rem_1fr]">
          <div>
            <p className="text-xs font-semibold text-ink-900">{r.name}</p>
            <p className="text-[0.6875rem] text-ink-500">{r.dept}</p>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {r.slots.map(([t, isTaken]) => (
              <span key={t} className={isTaken ? taken : open}>
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecordsVisual() {
  const visits = [
    { date: "12 Aug", dx: "Hypertension, stage 1", by: "Dr. Okafor" },
    { date: "03 Jun", dx: "Seasonal allergic rhinitis", by: "Dr. Haile" },
  ];
  return (
    <ol className="space-y-3">
      {visits.map((v) => (
        <li key={v.date} className="flex gap-3">
          <span className="font-mono text-xs text-ink-500">{v.date}</span>
          <div className="min-w-0 border-l border-rule-strong pl-3">
            <p className="truncate text-xs font-medium text-ink-900">{v.dx}</p>
            <p className="text-[0.6875rem] text-ink-500">{v.by}</p>
          </div>
        </li>
      ))}
      <li className="flex items-center gap-1.5 pt-0.5 text-[0.6875rem] text-ink-500">
        <PaperclipIcon width={13} height={13} /> lab-results.pdf · 1.2 MB
      </li>
    </ol>
  );
}

function PrescriptionVisual() {
  const meds = [
    { name: "Amlodipine 5 mg", dose: "1× daily · 30 days" },
    { name: "Cetirizine 10 mg", dose: "As needed · 14 days" },
  ];
  return (
    <ul className="divide-y divide-rule">
      {meds.map((m) => (
        <li key={m.name} className="py-2 first:pt-0 last:pb-0">
          <p className="text-xs font-semibold text-ink-900">{m.name}</p>
          <p className="font-mono text-[0.6875rem] text-ink-700">{m.dose}</p>
        </li>
      ))}
    </ul>
  );
}

function BillingVisual() {
  const lines: Array<[string, string]> = [
    ["Consultation", "800.00"],
    ["Blood panel", "400.00"],
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr]">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-xs text-ink-500">INV-2026-000031</span>
          <Badge tone="wait">Pending</Badge>
        </div>
        {lines.map(([label, amount]) => (
          <div key={label} className="flex justify-between border-b border-rule py-1.5 text-xs text-ink-700">
            <span>{label}</span>
            <span className="font-mono tabular-nums">{amount}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 text-xs font-semibold text-ink-900">
          <span>Total (ETB)</span>
          <span className="font-mono tabular-nums">1,200.00</span>
        </div>
      </div>
      <div className="rounded-md border border-rule bg-white p-3">
        <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-ink-500">Payments</p>
        <div className="mt-2 flex justify-between font-mono text-xs tabular-nums text-ink-700">
          <span>Recorded</span>
          <span>500.00</span>
        </div>
        <div className="mt-1 flex justify-between font-mono text-xs font-semibold tabular-nums text-ink-900">
          <span>Balance</span>
          <span>700.00</span>
        </div>
      </div>
    </div>
  );
}

function PeopleVisual() {
  const rows = [
    ["P-000128", "Selam T."],
    ["P-000127", "Daniel M."],
    ["P-000126", "Hana B."],
  ];
  return (
    <ul className="divide-y divide-rule">
      {rows.map(([mrn, name]) => (
        <li key={mrn} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
          <span className="text-xs font-medium text-ink-900">{name}</span>
          <span className="font-mono text-[0.6875rem] text-ink-500">{mrn}</span>
        </li>
      ))}
    </ul>
  );
}

function MessagingVisual() {
  return (
    <div className="space-y-2">
      <p className="max-w-[85%] rounded-md rounded-bl-none bg-white px-2.5 py-1.5 text-xs text-ink-700 shadow-[0_0_0_1px_var(--color-rule)]">
        Is it fine to take this with food?
      </p>
      <p className="ml-auto max-w-[85%] rounded-md rounded-br-none bg-accent-700 px-2.5 py-1.5 text-xs text-white">
        Yes — with a meal is best.
      </p>
    </div>
  );
}

function NotificationsVisual() {
  const items: Array<[string, boolean]> = [
    ["Appointment confirmed", true],
    ["New prescription issued", true],
    ["Invoice INV-2026-000031", false],
  ];
  return (
    <ul className="space-y-2">
      {items.map(([label, unread]) => (
        <li key={label} className="flex items-center gap-2 text-xs text-ink-900">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${unread ? "bg-accent-600" : "bg-rule-strong"}`} />
          <span className={unread ? "font-medium" : "text-ink-500"}>{label}</span>
        </li>
      ))}
    </ul>
  );
}

export function Features() {
  return (
    <section id="platform" aria-labelledby="platform-heading" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <SectionHeading id="platform-heading" eyebrow="The platform" title="Every step of a visit has a place.">
          Scheduling, the chart, prescriptions and billing share one record, so nobody re-enters what someone
          else already knows.
        </SectionHeading>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Tile
            className="md:col-span-2"
            icon={<CalendarIcon width={18} height={18} />}
            title="Appointments"
            visual={<AppointmentsVisual />}
          >
            Doctors publish availability; patients see only the slots that are actually bookable. Booking,
            rescheduling and cancelling happen in the app, and a slot can&apos;t be taken twice.
          </Tile>

          <Tile icon={<RecordIcon width={18} height={18} />} title="Medical records" visual={<RecordsVisual />}>
            Visits with diagnosis, symptoms, treatment and notes, in date order and linked to the doctor. Attach
            PDFs and images up to 15 MB.
          </Tile>

          <Tile icon={<PillIcon width={18} height={18} />} title="Prescriptions" visual={<PrescriptionVisual />}>
            Issued by doctors only, with dosage, frequency, duration and instructions for every medication.
          </Tile>

          <Tile
            className="md:col-span-2"
            icon={<ReceiptIcon width={18} height={18} />}
            title="Billing & payments"
            visual={<BillingVisual />}
          >
            Itemised invoices with totals computed on the server and a ledger of every payment. Status follows
            what has been recorded. Online card payment is available where the hospital has switched it on.
          </Tile>

          <Tile icon={<UsersIcon width={18} height={18} />} title="Patients & doctors" visual={<PeopleVisual />}>
            Searchable directories, clinical profiles and departments for staff to manage. A doctor sees only
            the patients they treat.
          </Tile>

          <Tile icon={<MessageIcon width={18} height={18} />} title="Messaging" visual={<MessagingVisual />}>
            Conversations between patients, doctors and staff, visible only to the people in them.
          </Tile>

          <Tile
            className="md:col-span-2 lg:col-span-1"
            icon={<BellIcon width={18} height={18} />}
            title="Notifications"
            visual={<NotificationsVisual />}
          >
            In-app notifications for appointments, prescriptions, invoices and messages, with an unread count.
          </Tile>
        </div>
      </div>
    </section>
  );
}
