import type { ReactNode } from "react";
import { BellIcon, CalendarIcon, ClockIcon, MessageIcon } from "@/components/ui/Icons";
import { firstName, greetingFor } from "@/lib/patient-ui";

function todayLabel(): string {
  return new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

/// Status pills only render when there is something worth surfacing — an empty
/// clinic day should look calm, not show a row of zeroes.
function Pill({ icon, label, tone = "neutral" }: { icon: ReactNode; label: string; tone?: "neutral" | "accent" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
        tone === "accent" ? "bg-accent-400/15 text-accent-400" : "bg-white/10 text-white/80"
      }`}
    >
      <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      {label}
    </span>
  );
}

/// The first thing a doctor sees: who they are, what day it is, and a
/// one-glance read on today's load. Same dark clinical-brand surface used
/// across the product's other "welcome" moments, kept restrained here —
/// this screen is read many times a day and needs to load fast and scan fast.
export function DoctorHeader({
  name,
  todaysCount,
  pendingCount,
  unreadMessages,
}: {
  name: string | null | undefined;
  todaysCount: number;
  pendingCount: number;
  unreadMessages: number;
}) {
  const who = firstName(name);
  const heading = `${greetingFor(new Date().getHours())}${who ? `, Dr. ${who}` : ""}`;

  return (
    <section aria-labelledby="doctor-overview-heading" className="relative overflow-hidden rounded-xl bg-panel text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-grid-dark absolute inset-0" />
        <div className="glow-accent-dark absolute -right-24 -top-32 h-[24rem] w-[24rem]" />
      </div>

      <div className="relative flex flex-col gap-4 p-5 sm:p-7">
        <div>
          <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-accent-400">{todayLabel()}</p>
          <h1 id="doctor-overview-heading" className="mt-2 text-[1.625rem] font-semibold leading-tight tracking-[-0.02em] sm:text-3xl">
            {heading}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">
            {todaysCount === 0
              ? "Nothing is booked with you today. Use the time to catch up on charts and messages."
              : `You have ${todaysCount} ${todaysCount === 1 ? "appointment" : "appointments"} on today's schedule.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill icon={<CalendarIcon />} label={`${todaysCount} today`} tone="accent" />
          {pendingCount > 0 && <Pill icon={<ClockIcon />} label={`${pendingCount} awaiting confirmation`} />}
          {unreadMessages > 0 && <Pill icon={<MessageIcon />} label={`${unreadMessages} unread ${unreadMessages === 1 ? "message" : "messages"}`} />}
          {pendingCount === 0 && unreadMessages === 0 && <Pill icon={<BellIcon />} label="You're all caught up" />}
        </div>
      </div>
    </section>
  );
}
