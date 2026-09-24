import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-client";
import {
  canCancel,
  canPayOnline,
  dayHeading,
  describeDayDistance,
  doctorLabel,
  firstName,
  formatMoney,
  friendlyError,
  greetingFor,
  initials,
  isSameDay,
  invoiceBalance,
  paymentMethodLabel,
  relativeTime,
  splitAppointments,
  splitPrescriptions,
  sumAmounts,
} from "@/lib/patient-ui";

describe("names", () => {
  it("builds initials from up to two words and copes with blanks", () => {
    expect(initials("Selam Tesfaye")).toBe("ST");
    expect(initials("  amara  ")).toBe("A");
    expect(initials("Mary Jane Watson")).toBe("MJ");
    expect(initials("")).toBe("?");
    expect(initials(null)).toBe("?");
  });

  it("takes the first word as a first name", () => {
    expect(firstName("Selam Tesfaye")).toBe("Selam");
    expect(firstName(undefined)).toBe("");
  });

  it("prefixes doctors and flags unassigned appointments", () => {
    expect(doctorLabel("Okafor")).toBe("Dr. Okafor");
    expect(doctorLabel(null)).toBe("Unassigned");
  });
});

describe("greetingFor", () => {
  it("changes at noon and at six in the evening", () => {
    expect(greetingFor(0)).toBe("Good morning");
    expect(greetingFor(11)).toBe("Good morning");
    expect(greetingFor(12)).toBe("Good afternoon");
    expect(greetingFor(17)).toBe("Good afternoon");
    expect(greetingFor(18)).toBe("Good evening");
    expect(greetingFor(23)).toBe("Good evening");
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-09-20T12:00:00Z").getTime();
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it("describes recent times in the smallest sensible unit", () => {
    expect(relativeTime(ago(10_000), now)).toBe("Just now");
    expect(relativeTime(ago(5 * 60_000), now)).toBe("5 min ago");
    expect(relativeTime(ago(3 * 3_600_000), now)).toBe("3 h ago");
    expect(relativeTime(ago(30 * 3_600_000), now)).toBe("Yesterday");
  });

  it("falls back to a calendar date after two days", () => {
    expect(/ago|Yesterday|Just now/.test(relativeTime(ago(5 * 86_400_000), now))).toBe(false);
  });
});

describe("describeDayDistance", () => {
  // Local-time noon, so the result doesn't depend on the runner's time zone.
  const now = new Date(2026, 8, 20, 12, 0, 0).getTime();
  const atDay = (offset: number, hour = 9) => new Date(2026, 8, 20 + offset, hour, 30).toISOString();

  it("speaks in calendar days rather than 24-hour blocks", () => {
    expect(describeDayDistance(atDay(0, 8), now)).toBe("today");
    expect(describeDayDistance(atDay(0, 23), now)).toBe("today");
    expect(describeDayDistance(atDay(1, 0), now)).toBe("tomorrow");
    expect(describeDayDistance(atDay(5), now)).toBe("in 5 days");
    expect(describeDayDistance(atDay(-1), now)).toBe("yesterday");
    expect(describeDayDistance(atDay(-4), now)).toBe("4 days ago");
  });
});

describe("message day headings", () => {
  const now = new Date(2026, 8, 20, 12, 0, 0).getTime();
  const at = (offset: number, hour = 9) => new Date(2026, 8, 20 + offset, hour, 15).toISOString();

  it("names today and yesterday and dates everything else", () => {
    expect(dayHeading(at(0), now)).toBe("Today");
    expect(dayHeading(at(-1), now)).toBe("Yesterday");
    expect(dayHeading(at(-6), now)).not.toBe("Today");
  });

  it("groups messages by calendar day, not by 24-hour distance", () => {
    expect(isSameDay(at(0, 0), at(0, 23))).toBe(true);
    expect(isSameDay(at(0, 23), at(1, 0))).toBe(false);
  });
});

describe("splitAppointments", () => {
  const now = new Date("2026-09-20T12:00:00Z").getTime();
  const at = (days: number) => new Date(now + days * 86_400_000).toISOString();
  const items = [
    { id: 1, status: "CONFIRMED", date: at(5) },
    { id: 2, status: "PENDING", date: at(1) },
    { id: 3, status: "COMPLETED", date: at(-3) },
    { id: 4, status: "CANCELLED", date: at(2) },
    { id: 5, status: "PENDING", date: at(-1) },
    { id: 6, status: "NO_SHOW", date: at(-10) },
  ];

  it("puts open, future appointments first-to-happen first", () => {
    const { upcoming } = splitAppointments(items, now);
    expect(upcoming.map((a) => a.id)).toEqual([2, 1]);
  });

  it("treats cancelled, finished and lapsed appointments as history, newest first", () => {
    const { past } = splitAppointments(items, now);
    // 4 is cancelled (so history even though its date is ahead), 5 lapsed while
    // still pending, 3 completed, 6 no-show.
    expect(past.map((a) => a.id)).toEqual([4, 5, 3, 6]);
  });

  it("does not lose or duplicate anything", () => {
    const { upcoming, past } = splitAppointments(items, now);
    expect(upcoming.length + past.length).toBe(items.length);
    expect(new Set([...upcoming, ...past].map((a) => a.id)).size).toBe(items.length);
  });

  it("only offers cancel for open appointments", () => {
    expect(canCancel("PENDING")).toBe(true);
    expect(canCancel("CONFIRMED")).toBe(true);
    for (const s of ["COMPLETED", "CANCELLED", "NO_SHOW"]) expect(canCancel(s)).toBe(false);
  });
});

describe("splitPrescriptions", () => {
  it("separates active prescriptions and keeps order within each group", () => {
    const list = [
      { id: 1, status: "COMPLETED" },
      { id: 2, status: "ACTIVE" },
      { id: 3, status: "ACTIVE" },
      { id: 4, status: "CANCELLED" },
    ];
    const { active, earlier } = splitPrescriptions(list);
    expect(active.map((p) => p.id)).toEqual([2, 3]);
    expect(earlier.map((p) => p.id)).toEqual([1, 4]);
  });
});

describe("billing", () => {
  it("formats decimal strings to two places and leaves non-numbers alone", () => {
    expect(/^1\D?200\.00$/.test(formatMoney("1200"))).toBe(true);
    expect(/5\.50$/.test(formatMoney(5.5))).toBe(true);
    expect(formatMoney("n/a")).toBe("n/a");
  });

  it("sums payments, ignoring unreadable amounts", () => {
    expect(sumAmounts(["100.00", "250.50", "oops"])).toBe(350.5);
  });

  it("computes the balance from total minus payments and never goes negative", () => {
    expect(invoiceBalance("1200.00", [{ amount: "500.00" }])).toBe(700);
    expect(invoiceBalance("1200.00", [{ amount: "500.00" }, { amount: "700.00" }])).toBe(0);
    expect(invoiceBalance("100.00", [{ amount: "150.00" }])).toBe(0);
    expect(invoiceBalance("0.10", [{ amount: "0.03" }])).toBe(0.07);
    expect(invoiceBalance("abc", [])).toBe(0);
  });

  it("offers online payment only for unpaid, live invoices", () => {
    expect(canPayOnline("PENDING")).toBe(true);
    expect(canPayOnline("OVERDUE")).toBe(true);
    for (const s of ["DRAFT", "PAID", "CANCELLED"]) expect(canPayOnline(s)).toBe(false);
  });

  it("labels every payment method the schema defines", () => {
    expect(paymentMethodLabel("BANK_TRANSFER")).toBe("Bank transfer");
    expect(paymentMethodLabel("MOBILE_MONEY")).toBe("Mobile money");
    expect(paymentMethodLabel("INSURANCE")).toBe("Insurance");
    expect(paymentMethodLabel("SOMETHING_NEW")).toBe("Something new");
  });
});

describe("friendlyError", () => {
  const fallback = "Something went wrong.";

  it("passes through messages written for people (4xx)", () => {
    expect(friendlyError(new ApiError("Pick a date in the future", 422), fallback)).toBe("Pick a date in the future");
    expect(friendlyError(new ApiError("That slot is already booked", 409), fallback)).toBe("That slot is already booked");
  });

  it("hides server errors and anything unexpected", () => {
    expect(friendlyError(new ApiError("PrismaClientKnownRequestError: connection refused", 500), fallback)).toBe(fallback);
    expect(friendlyError(new TypeError("Failed to fetch"), fallback)).toBe(fallback);
    expect(friendlyError("boom", fallback)).toBe(fallback);
    expect(friendlyError(new ApiError("", 400), fallback)).toBe(fallback);
  });
});
