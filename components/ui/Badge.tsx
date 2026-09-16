import type { ReactNode } from "react";

// Colour is reserved for status across this application. A badge's colour is
// never decorative — it always maps to one of these four clinical meanings.
export type BadgeTone = "ok" | "wait" | "stop" | "info" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  ok: "bg-[var(--color-signal-ok-bg)] text-[var(--color-signal-ok)]",
  wait: "bg-[var(--color-signal-wait-bg)] text-[var(--color-signal-wait)]",
  stop: "bg-[var(--color-signal-stop-bg)] text-[var(--color-signal-stop)]",
  info: "bg-[var(--color-signal-info-bg)] text-[var(--color-signal-info)]",
  neutral: "bg-ink-900/5 text-ink-700",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

const APPOINTMENT_TONE: Record<string, BadgeTone> = {
  PENDING: "wait",
  CONFIRMED: "info",
  COMPLETED: "ok",
  CANCELLED: "neutral",
  NO_SHOW: "stop",
};

const INVOICE_TONE: Record<string, BadgeTone> = {
  DRAFT: "neutral",
  PENDING: "wait",
  PAID: "ok",
  OVERDUE: "stop",
  CANCELLED: "neutral",
};

const PRESCRIPTION_TONE: Record<string, BadgeTone> = {
  ACTIVE: "info",
  COMPLETED: "ok",
  CANCELLED: "neutral",
};

function labelize(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}

export function AppointmentStatusBadge({ status }: { status: string }) {
  return <Badge tone={APPOINTMENT_TONE[status] ?? "neutral"}>{labelize(status)}</Badge>;
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  return <Badge tone={INVOICE_TONE[status] ?? "neutral"}>{labelize(status)}</Badge>;
}

export function PrescriptionStatusBadge({ status }: { status: string }) {
  return <Badge tone={PRESCRIPTION_TONE[status] ?? "neutral"}>{labelize(status)}</Badge>;
}
