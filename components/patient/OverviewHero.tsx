import { AppointmentStatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArrowRightIcon, CalendarIcon, PlusIcon } from "@/components/ui/Icons";
import type { Appointment, DashboardStats } from "@/components/patient/types";
import {
  dateParts,
  describeDayDistance,
  doctorLabel,
  firstName,
  formatTimeRange,
  greetingFor,
} from "@/lib/patient-ui";

/// The first thing a patient sees: a greeting and the next appointment, on the
/// same dark surface as the landing page's security section and the sign-in
/// brand panel. `detail` is the matching row from the appointments list (when
/// loaded) and only adds specialty and duration.
export function OverviewHero({
  name,
  next,
  detail,
}: {
  name: string | null | undefined;
  next: DashboardStats["nextAppointment"];
  detail?: Appointment;
}) {
  const who = firstName(name);
  const heading = `${greetingFor(new Date().getHours())}${who ? `, ${who}` : ""}`;
  const parts = next ? dateParts(next.date) : null;
  const doctorName = next?.doctor?.user.name ?? null;

  return (
    <section aria-labelledby="overview-heading" className="relative overflow-hidden rounded-xl bg-ink-900 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-grid-dark absolute inset-0" />
        <div className="glow-accent-dark absolute -left-24 -top-32 h-[26rem] w-[26rem]" />
      </div>

      <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-10">
        <div>
          <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-accent-400">Your overview</p>
          <h1
            id="overview-heading"
            className="mt-3 text-[1.875rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-4xl"
          >
            {heading}
          </h1>
          <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-white/70">
            {next
              ? `Your next appointment is ${describeDayDistance(next.date)}. Everything else in your care is below.`
              : "You have nothing booked right now. Pick an open slot with a doctor whenever you're ready."}
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <ButtonLink href="/appointment" variant="light" size="lg" className="group">
              <PlusIcon className="h-[18px] w-[18px]" />
              Book appointment
            </ButtonLink>
            <ButtonLink href="/dashboard/messages" variant="outlineLight" size="lg">
              Messages
            </ButtonLink>
          </div>
        </div>

        {next && parts ? (
          <div className="rounded-xl border border-white/10 bg-ink-800/80 p-4 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.5)] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white/70">Next appointment</p>
              <AppointmentStatusBadge status={next.status} />
            </div>
            <div className="mt-4 flex gap-4">
              <div
                aria-hidden="true"
                className="flex h-[4.5rem] w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-white text-ink-900"
              >
                <span className="font-mono text-[0.625rem] font-medium uppercase tracking-wider text-accent-700">
                  {parts.weekday}
                </span>
                <span className="font-mono text-2xl font-semibold leading-none tabular-nums">{parts.day}</span>
                <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-500">{parts.month}</span>
              </div>
              <div className="min-w-0">
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {formatTimeRange(next.date, detail?.durationMinutes ?? 30)}
                </p>
                <p className="mt-1 truncate text-[0.9375rem] font-medium">{doctorLabel(doctorName)}</p>
                <p className="truncate text-sm text-white/60">
                  {detail?.doctor?.specialization ? `${detail.doctor.specialization} · ` : ""}
                  {next.department}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.04] p-6 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-accent-400">
              <CalendarIcon className="h-[22px] w-[22px]" />
            </span>
            <p className="mt-3 text-[0.9375rem] font-semibold">No upcoming appointments</p>
            <p className="mt-1 text-sm text-white/60">Booked visits appear here with the doctor, date and time.</p>
            <ButtonLink href="/appointment" variant="outlineLight" size="sm" className="mt-3">
              Find a time
              <ArrowRightIcon className="h-4 w-4" />
            </ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}
