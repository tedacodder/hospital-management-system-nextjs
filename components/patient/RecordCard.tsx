import { Card } from "@/components/ui/Card";
import type { MedicalRecord } from "@/components/patient/types";
import { doctorLabel, formatDate } from "@/lib/patient-ui";

const FIELDS: Array<{ key: "diagnosis" | "symptoms" | "treatment" | "notes"; label: string }> = [
  { key: "diagnosis", label: "Diagnosis" },
  { key: "symptoms", label: "Symptoms" },
  { key: "treatment", label: "Treatment" },
  { key: "notes", label: "Notes" },
];

/// One visit in the chart. The summary line is the record's own `details`; the
/// structured fields appear only when the doctor filled them in.
export function RecordCard({ record: r }: { record: MedicalRecord }) {
  const fields = FIELDS.filter((f) => r[f.key]);
  return (
    <li className="relative pl-7 sm:pl-9 [&:last-child>span:first-child]:hidden">
      {/* Timeline rail and node */}
      <span aria-hidden="true" className="absolute left-[7px] top-6 -bottom-4 w-px bg-rule-strong sm:left-[9px]" />
      <span aria-hidden="true" className="absolute left-0 top-5 h-[15px] w-[15px] rounded-full border-2 border-accent-600 bg-paper sm:left-[2px]" />

      <Card padded={false}>
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <time dateTime={r.visitDate} className="font-mono text-sm text-ink-500">
              {formatDate(r.visitDate)}
            </time>
            <p className="text-sm text-ink-500">
              {doctorLabel(r.doctor?.user.name)}
              {r.doctor?.specialization ? ` · ${r.doctor.specialization}` : ""}
            </p>
          </div>

          <h3 className="mt-2 text-[0.9375rem] font-semibold leading-snug text-ink-900">{r.details}</h3>

          {fields.length > 0 && (
            <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className={f.key === "notes" ? "sm:col-span-2" : ""}>
                  <dt className="text-xs font-medium uppercase tracking-wider text-ink-500">{f.label}</dt>
                  <dd className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">{r[f.key]}</dd>
                </div>
              ))}
            </dl>
          )}

          {r.prescriptions.length > 0 && (
            <p className="mt-3 inline-flex items-center rounded-sm bg-accent-050 px-2 py-0.5 text-xs font-medium text-accent-700">
              {r.prescriptions.length} {r.prescriptions.length === 1 ? "prescription" : "prescriptions"} issued at this visit
            </p>
          )}
        </div>
      </Card>
    </li>
  );
}
