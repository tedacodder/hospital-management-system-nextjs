import { PrescriptionStatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PillIcon } from "@/components/ui/Icons";
import type { Prescription } from "@/components/patient/types";
import { doctorLabel, formatDate } from "@/lib/patient-ui";

/// Shows only what the prescription record holds: medication, dosage,
/// frequency, duration, instructions and the doctor's note. No advice is
/// added by the interface.
export function PrescriptionCard({ prescription: p }: { prescription: Prescription }) {
  const active = p.status === "ACTIVE";
  return (
    <Card padded={false} className={active ? "border-l-2 border-l-accent-600" : ""}>
      <div className="flex items-start justify-between gap-3 border-b border-rule px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
              active ? "bg-accent-050 text-accent-700" : "bg-ink-900/5 text-ink-500"
            }`}
          >
            <PillIcon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">{doctorLabel(p.doctor.user.name)}</p>
            <p className="truncate text-xs text-ink-500">
              {p.doctor.specialization} · Issued {formatDate(p.issuedAt)}
            </p>
          </div>
        </div>
        <PrescriptionStatusBadge status={p.status} />
      </div>

      <ul className="divide-y divide-rule px-4 sm:px-5">
        {p.items.map((i) => (
          <li key={i.id} className="py-3.5">
            <p className="text-[0.9375rem] font-semibold text-ink-900">{i.medication}</p>
            <p className="mt-0.5 font-mono text-[0.8125rem] text-ink-700">
              {i.dosage} · {i.frequency}
              {i.durationDays ? ` · ${i.durationDays} ${i.durationDays === 1 ? "day" : "days"}` : ""}
            </p>
            {i.instructions && <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{i.instructions}</p>}
          </li>
        ))}
      </ul>

      {p.notes && (
        <p className="border-t border-rule bg-paper px-4 py-3 text-sm leading-relaxed text-ink-700 sm:px-5">
          <span className="font-medium text-ink-900">Doctor&apos;s note: </span>
          {p.notes}
        </p>
      )}
    </Card>
  );
}
