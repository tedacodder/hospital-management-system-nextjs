import { AppointmentStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Appointment } from "@/components/patient/types";
import { canCancel, dateParts, doctorLabel, formatTimeRange } from "@/lib/patient-ui";

/// One appointment: a calendar tile on the left, the who/when/why beside it,
/// and the actions the person is actually allowed to take.
export function AppointmentCard({
  appointment: a,
  cancelling,
  onDetails,
  onCancel,
  muted = false,
}: {
  appointment: Appointment;
  cancelling: boolean;
  onDetails: (a: Appointment) => void;
  onCancel: (a: Appointment) => void;
  /// History rows are visually quieter than upcoming ones.
  muted?: boolean;
}) {
  const { weekday, month, day } = dateParts(a.date);
  const cancelled = a.status === "CANCELLED";

  return (
    <Card interactive padded={false}>
      <div className="flex gap-4 p-4 sm:p-5">
        <div
          aria-hidden="true"
          className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg border ${
            muted ? "border-rule bg-paper text-ink-500" : "border-accent-700/15 bg-accent-050 text-accent-700"
          }`}
        >
          <span className="font-mono text-[0.625rem] font-medium uppercase tracking-wider">{weekday}</span>
          <span className="font-mono text-xl font-semibold leading-none tabular-nums">{day}</span>
          <span className="font-mono text-[0.625rem] uppercase tracking-wider">{month}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className={`font-mono text-sm tabular-nums ${cancelled ? "text-ink-500 line-through" : "text-ink-900"}`}>
              <span className="sr-only">
                {new Date(a.date).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })},{" "}
              </span>
              {formatTimeRange(a.date, a.durationMinutes)}
            </p>
            <AppointmentStatusBadge status={a.status} />
          </div>

          <p className="mt-1.5 truncate text-[0.9375rem] font-semibold text-ink-900">{doctorLabel(a.doctor?.user.name)}</p>
          <p className="truncate text-sm text-ink-500">
            {a.doctor?.specialization ? `${a.doctor.specialization} · ` : ""}
            {a.department}
          </p>
          <p className="mt-2 line-clamp-1 text-sm text-ink-700">{a.reason}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => onDetails(a)}>
              Details
            </Button>
            {canCancel(a.status) && (
              <Button size="sm" variant="danger" loading={cancelling} onClick={() => onCancel(a)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
