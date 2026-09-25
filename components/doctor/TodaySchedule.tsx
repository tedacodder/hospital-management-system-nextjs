"use client";

import Link from "next/link";
import { AppointmentStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, LoadingRows } from "@/components/ui/Card";
import { CalendarIcon, ChevronRightIcon } from "@/components/ui/Icons";
import type { TodayAppointment } from "@/components/doctor/types";
import { formatTime } from "@/lib/patient-ui";

type Props = {
  appointments: TodayAppointment[] | null;
  busyId: number | null;
  onConfirm: (id: number) => void;
  onNoShow: (id: number) => void;
  onStartVisit: (appointment: TodayAppointment) => void;
};

/// The doctor's actionable worklist for today, ordered by time. Every row
/// carries exactly the action that status can safely take next — a pending
/// visit is confirmed, a confirmed one is started, nothing else is offered
/// here (cancelling or rescheduling lives on the patient's own chart, not
/// this fast-scanning list).
export function TodaySchedule({ appointments, busyId, onConfirm, onNoShow, onStartVisit }: Props) {
  if (appointments === null) return <LoadingRows rows={4} />;

  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={<CalendarIcon />}
        title="Nothing on your schedule today"
        body="Confirmed and pending appointments for today will appear here as they're booked."
      />
    );
  }

  const now = Date.now();

  return (
    <ul className="flex flex-col gap-2.5">
      {appointments.map((a) => {
        const past = new Date(a.date).getTime() < now;
        return (
          <li key={a.id}>
            <Card padded={false} className={a.status === "COMPLETED" || a.status === "CANCELLED" ? "opacity-70" : ""}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
                <div className="w-16 shrink-0 font-mono text-sm font-semibold text-ink-900">{formatTime(a.date)}</div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/doc/patients/${a.patient.id}`}
                    className="truncate text-sm font-semibold text-ink-900 underline-offset-4 hover:text-accent-700 hover:underline"
                  >
                    {a.patient.user.name ?? "Patient"}
                  </Link>
                  <p className="truncate text-xs text-ink-500">
                    {a.patient.mrn ? `${a.patient.mrn} · ` : ""}
                    {a.reason}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <AppointmentStatusBadge status={a.status} />

                  {a.status === "PENDING" && (
                    <Button size="sm" variant="secondary" loading={busyId === a.id} onClick={() => onConfirm(a.id)}>
                      Confirm
                    </Button>
                  )}

                  {a.status === "CONFIRMED" && past && (
                    <Button size="sm" variant="secondary" loading={busyId === a.id} onClick={() => onNoShow(a.id)}>
                      No-show
                    </Button>
                  )}

                  {a.status === "CONFIRMED" && (
                    <Button size="sm" loading={busyId === a.id} onClick={() => onStartVisit(a)}>
                      Start visit
                    </Button>
                  )}

                  {(a.status === "COMPLETED" || a.status === "CANCELLED" || a.status === "NO_SHOW") && (
                    <Link
                      href={`/dashboard/doc/patients/${a.patient.id}`}
                      aria-label={`View ${a.patient.user.name ?? "patient"}'s chart`}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-ink-900/5 hover:text-ink-900"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
