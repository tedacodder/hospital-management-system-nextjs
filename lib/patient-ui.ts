import { ApiError } from "@/lib/api-client";

// Pure presentation helpers for the patient-facing screens. Nothing here reads
// or writes data: it only shapes values that the existing APIs already return
// (dates as ISO strings, money as decimal strings) into what the UI shows.

// ───────────────────────────── People ─────────────────────────────

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const letters = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return letters || "?";
}

export function firstName(name: string | null | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? "";
}

export function doctorLabel(name: string | null | undefined): string {
  return name ? `Dr. ${name}` : "Unassigned";
}

export function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// ───────────────────────────── Dates ─────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/// "10:00 AM – 10:30 AM"
export function formatTimeRange(startIso: string, minutes: number): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + minutes * 60_000);
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function dateParts(iso: string): { weekday: string; month: string; day: string } {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString([], { weekday: "short" }),
    month: d.toLocaleDateString([], { month: "short" }),
    day: String(d.getDate()),
  };
}

/// Calendar-day distance, in the viewer's own time zone: "today", "tomorrow",
/// "in 5 days", "yesterday", "3 days ago".
export function describeDayDistance(iso: string, now: number = Date.now()): string {
  const startOfDay = (t: number) => {
    const d = new Date(t);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  const days = Math.round((startOfDay(new Date(iso).getTime()) - startOfDay(now)) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

/// Heading for a run of messages sent on the same calendar day.
export function dayHeading(iso: string, now: number = Date.now()): string {
  const distance = describeDayDistance(iso, now);
  if (distance === "today") return "Today";
  if (distance === "yesterday") return "Yesterday";
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function isSameDay(aIso: string, bIso: string): boolean {
  const a = new Date(aIso);
  const b = new Date(bIso);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function relativeTime(iso: string, now: number = Date.now()): string {
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  if (hours < 48) return "Yesterday";
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

// ───────────────────────────── Appointments ─────────────────────────────

/// Statuses a patient may still act on. Mirrors the dashboard's original rule.
export function canCancel(status: string): boolean {
  return status === "PENDING" || status === "CONFIRMED";
}

interface HasDateAndStatus {
  date: string;
  status: string;
}

/// Upcoming = still open (pending or confirmed) and not yet started, soonest
/// first. Everything else — completed, cancelled, no-show, or open but already
/// in the past — is history, newest first.
export function splitAppointments<T extends HasDateAndStatus>(
  items: T[],
  now: number = Date.now(),
): { upcoming: T[]; past: T[] } {
  const upcoming: T[] = [];
  const past: T[] = [];
  for (const item of items) {
    if (canCancel(item.status) && new Date(item.date).getTime() >= now) upcoming.push(item);
    else past.push(item);
  }
  upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return { upcoming, past };
}

// ───────────────────────────── Prescriptions ─────────────────────────────

/// Active prescriptions first; otherwise keeps the API's newest-first order.
export function splitPrescriptions<T extends { status: string }>(items: T[]): { active: T[]; earlier: T[] } {
  return {
    active: items.filter((p) => p.status === "ACTIVE"),
    earlier: items.filter((p) => p.status !== "ACTIVE"),
  };
}

// ───────────────────────────── Billing ─────────────────────────────

/// Money arrives as a decimal string ("1200.00"). No currency symbol is added:
/// the invoice carries none, and the UI should not guess one.
export function formatMoney(value: string | number): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function sumAmounts(values: Array<string | number>): number {
  return values.reduce<number>((total, v) => {
    const n = Number(v);
    return Number.isFinite(n) ? total + n : total;
  }, 0);
}

export function invoiceBalance(total: string | number, payments: Array<{ amount: string | number }>): number {
  const owed = Number(total) - sumAmounts(payments.map((p) => p.amount));
  return Number.isFinite(owed) ? Math.max(0, Math.round(owed * 100) / 100) : 0;
}

export function canPayOnline(status: string): boolean {
  return status === "PENDING" || status === "OVERDUE";
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  BANK_TRANSFER: "Bank transfer",
  MOBILE_MONEY: "Mobile money",
  INSURANCE: "Insurance",
};

export function paymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method.charAt(0) + method.slice(1).toLowerCase().replace(/_/g, " ");
}

// ───────────────────────────── Errors ─────────────────────────────

/// Messages from 4xx responses are written for the person to read ("Pick a date
/// in the future"). Anything else — a 5xx, a dropped connection, an unexpected
/// exception — gets the caller's plain-language fallback instead, so internal
/// detail never reaches the screen.
export function friendlyError(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.status >= 400 && err.status < 500 && err.message) return err.message;
  return fallback;
}
