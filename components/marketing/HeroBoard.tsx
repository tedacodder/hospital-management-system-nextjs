import { delay } from "@/components/brand/motion";
import { Badge } from "@/components/ui/Badge";
import { PillIcon, ReceiptIcon } from "@/components/ui/Icons";

// An illustration of the product, drawn with the product's own components and
// vocabulary (status badges, mono figures, MRN-style identifiers). It is NOT
// live data: the names and figures are invented and the board says so. It is
// hidden from assistive technology because it carries no information the page
// text doesn't already give.

type Slot = { time: string; state: "taken" | "open" | "selected" };

const SLOTS: Slot[] = [
  { time: "09:00", state: "taken" },
  { time: "09:30", state: "open" },
  { time: "10:00", state: "selected" },
  { time: "10:30", state: "open" },
  { time: "11:00", state: "taken" },
  { time: "11:30", state: "open" },
  { time: "12:00", state: "open" },
  { time: "12:30", state: "taken" },
];

function slotClass(state: Slot["state"]) {
  switch (state) {
    case "taken":
      return "border-transparent bg-ink-900/[0.04] text-ink-300 line-through decoration-ink-300/70";
    case "selected":
      return "border-accent-700 bg-accent-700 text-white shadow-[0_1px_2px_rgb(15_92_85/0.35)]";
    default:
      return "border-rule-strong bg-surface text-ink-900";
  }
}

const CARD = "rounded-lg border border-rule bg-surface shadow-[var(--shadow-float)]";

export function HeroBoard() {
  return (
    <div aria-hidden="true" className="relative select-none lg:pb-24 lg:pt-32">
      {/* Ambient light behind the board — one soft wash, not a pattern. */}
      <div className="glow-accent pointer-events-none absolute -inset-16 -z-10 opacity-90" />

      {/* Main panel: booking against real availability */}
      <div className={`${CARD} animate-rise overflow-hidden rounded-xl`} style={delay(140)}>
        <div className="flex items-center justify-between border-b border-rule bg-paper px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rule-strong" />
            <span className="h-2 w-2 rounded-full bg-rule-strong" />
            <span className="h-2 w-2 rounded-full bg-rule-strong" />
          </div>
          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-500">Sample data</span>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-ink-500">Book an appointment</p>

          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-050 text-sm font-semibold text-accent-700">
              AO
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">Dr. Amara Okafor</p>
              <p className="truncate text-xs text-ink-500">Cardiology · Monday</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-signal-ok)]">
              <span className="status-pulse h-1.5 w-1.5 rounded-full bg-[var(--color-signal-ok)]" />
              Taking bookings
            </span>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {SLOTS.map((s) => (
              <span
                key={s.time}
                className={`flex h-9 items-center justify-center rounded-md border font-mono text-[0.8125rem] ${slotClass(s.state)}`}
              >
                {s.time}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-rule pt-4">
            <p className="text-xs text-ink-500">
              Slots come from the doctor&apos;s availability. Booked times can&apos;t be picked.
            </p>
            <span className="inline-flex h-9 shrink-0 items-center rounded-md bg-accent-700 px-3.5 text-sm font-medium text-white">
              Confirm 10:00
            </span>
          </div>
        </div>
      </div>

      {/* Satellites. Below lg they sit in a swipeable row / grid under the
          board; from lg they hang above and below it (never over its content),
          so the illustration stays legible at every width. */}
      <div className="-mx-5 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:contents">
        <div
          className={`${CARD} animate-rise w-64 shrink-0 snap-start p-3.5 sm:w-auto lg:absolute lg:right-4 lg:top-0 lg:w-52 xl:w-56`}
          style={delay(320)}
        >
          <div className="animate-float" style={delay(0)}>
            <p className="text-xs font-medium text-ink-500">Appointment status</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Badge tone="wait">Pending</Badge>
              <span className="text-ink-300">›</span>
              <Badge tone="info">Confirmed</Badge>
              <span className="text-ink-300">›</span>
              <span className="opacity-45">
                <Badge tone="ok">Completed</Badge>
              </span>
            </div>
            <p className="mt-2.5 text-xs text-ink-500">Confirmed by the clinic</p>
          </div>
        </div>

        <div
          className={`${CARD} animate-rise w-64 shrink-0 snap-start p-3.5 sm:w-auto lg:absolute lg:bottom-2 lg:left-0 lg:w-52 xl:w-56`}
          style={delay(440)}
        >
          <div className="animate-float" style={delay(1800)}>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
                <PillIcon width={14} height={14} />
                Prescription
              </span>
              <Badge tone="info">Active</Badge>
            </div>
            <p className="mt-2 text-sm font-semibold text-ink-900">Amoxicillin 500 mg</p>
            <p className="mt-0.5 font-mono text-xs text-ink-700">3× daily · 7 days</p>
            <p className="mt-2 text-xs text-ink-500">Issued by Dr. Okafor</p>
          </div>
        </div>

        <div
          className={`${CARD} animate-rise w-64 shrink-0 snap-start p-3.5 sm:w-auto lg:absolute lg:bottom-2 lg:right-0 lg:w-52 xl:w-56`}
          style={delay(560)}
        >
          <div className="animate-float" style={delay(900)}>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
                <ReceiptIcon width={14} height={14} />
                Invoice
              </span>
              <Badge tone="ok">Paid</Badge>
            </div>
            <p className="mt-2 font-mono text-xs text-ink-500">INV-2026-000031</p>
            <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-ink-900">ETB 1,200.00</p>
            <p className="mt-1 text-xs text-ink-500">Consultation · itemised</p>
          </div>
        </div>
      </div>
    </div>
  );
}
