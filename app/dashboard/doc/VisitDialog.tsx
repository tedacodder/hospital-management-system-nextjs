"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Dialog } from "@/components/ui/Dialog";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { Button } from "@/components/ui/Button";
import { PlusIcon, TrashIcon } from "@/components/ui/Icons";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { apiSend, ApiError } from "@/lib/api-client";

type Props = {
  open: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  appointmentId?: number;
  /// Shown in the dialog header for context when opened from today's schedule.
  appointmentContext?: string;
  onSaved: () => void;
};

type MedLine = { medication: string; dosage: string; frequency: string; durationDays: string; instructions: string };

const emptyLine = (): MedLine => ({ medication: "", dosage: "", frequency: "", durationDays: "", instructions: "" });

/// One dialog, organised as a real clinical note: the visit record first,
/// an optional prescription second, and the patient's documents last for
/// quick reference. Saved as separate API calls because they're separate
/// clinical acts, even though they happen in one visit — and, when this visit
/// is tied to a confirmed appointment, that appointment is marked completed
/// once the note is saved, so it drops off today's open worklist on its own.
export function VisitDialog({ open, onClose, patientId, patientName, appointmentId, appointmentContext, onSaved }: Props) {
  const { push } = useToast();
  const { data: session } = useSession();
  const [diagnosis, setDiagnosis] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [includeRx, setIncludeRx] = useState(false);
  const [rxNotes, setRxNotes] = useState("");
  const [lines, setLines] = useState<MedLine[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setDiagnosis("");
    setSymptoms("");
    setTreatment("");
    setNotes("");
    setIncludeRx(false);
    setRxNotes("");
    setLines([emptyLine()]);
    setError(null);
  }

  function updateLine(i: number, patch: Partial<MedLine>) {
    const next = [...lines];
    next[i] = { ...next[i], ...patch };
    setLines(next);
  }

  async function handleSave() {
    if (!diagnosis.trim() && !treatment.trim() && !notes.trim()) {
      setError("Add at least a diagnosis, treatment, or note before saving.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const record = await apiSend<{ id: number }>("POST", "/records", {
        patientId,
        appointmentId,
        details: diagnosis.trim() || treatment.trim() || "Visit note",
        diagnosis: diagnosis || undefined,
        symptoms: symptoms || undefined,
        treatment: treatment || undefined,
        notes: notes || undefined,
      });

      if (includeRx) {
        const items = lines
          .filter((l) => l.medication.trim() && l.dosage.trim() && l.frequency.trim())
          .map((l) => ({
            medication: l.medication,
            dosage: l.dosage,
            frequency: l.frequency,
            durationDays: l.durationDays ? Number(l.durationDays) : undefined,
            instructions: l.instructions || undefined,
          }));
        if (items.length > 0) {
          await apiSend("POST", "/prescriptions", {
            patientId,
            medicalRecordId: record.id,
            appointmentId,
            notes: rxNotes || undefined,
            items,
          });
        }
      }

      // Closing the loop: a visit note written against a confirmed appointment
      // means that appointment is done. Best-effort — the note itself is
      // already saved either way, so this failing quietly is the right call
      // rather than surfacing a second error for something secondary.
      if (appointmentId) {
        await apiSend("PATCH", `/appointments/${appointmentId}`, { status: "COMPLETED" }).catch(() => {});
      }

      push(`Visit note saved for ${patientName}.`);
      onSaved();
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Visit note — ${patientName}`}>
      <div className="flex flex-col gap-5">
        {appointmentContext && (
          <p className="-mt-2 rounded-md bg-accent-050 px-3 py-2 text-xs font-medium text-accent-700">{appointmentContext}</p>
        )}

        <section className="flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Clinical note</h3>
          <TextField label="Diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextAreaField label="Symptoms" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
            <TextAreaField label="Treatment" value={treatment} onChange={(e) => setTreatment(e.target.value)} />
          </div>
          <TextAreaField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </section>

        <section className="border-t border-rule pt-4">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-900">
            <input
              type="checkbox"
              checked={includeRx}
              onChange={(e) => setIncludeRx(e.target.checked)}
              className="h-4 w-4 rounded border-rule-strong text-accent-700 focus-visible:outline-accent-600"
            />
            Issue a prescription with this visit
          </label>

          {includeRx && (
            <div className="mt-3 flex flex-col gap-3 rounded-md border border-rule p-3.5">
              {lines.map((line, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-md bg-paper p-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <TextField
                      id={`rx-${i}-medication`}
                      label="Medication"
                      value={line.medication}
                      onChange={(e) => updateLine(i, { medication: e.target.value })}
                    />
                    <TextField
                      id={`rx-${i}-dosage`}
                      label="Dosage"
                      value={line.dosage}
                      onChange={(e) => updateLine(i, { dosage: e.target.value })}
                    />
                    <TextField
                      id={`rx-${i}-frequency`}
                      label="Frequency"
                      value={line.frequency}
                      onChange={(e) => updateLine(i, { frequency: e.target.value })}
                    />
                    <TextField
                      id={`rx-${i}-days`}
                      label="Days"
                      inputMode="numeric"
                      value={line.durationDays}
                      onChange={(e) => updateLine(i, { durationDays: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <TextField
                        id={`rx-${i}-instructions`}
                        label="Instructions"
                        optional
                        placeholder="e.g. Take with food"
                        value={line.instructions}
                        onChange={(e) => updateLine(i, { instructions: e.target.value })}
                      />
                    </div>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLines(lines.filter((_, li) => li !== i))}
                        aria-label="Remove medication"
                        className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-[var(--color-signal-stop-bg)] hover:text-[var(--color-signal-stop)]"
                      >
                        <TrashIcon className="h-[18px] w-[18px]" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setLines([...lines, emptyLine()])}
                className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-accent-700 hover:underline"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add another medication
              </button>
              <TextAreaField
                label="Prescription note"
                optional
                placeholder="Anything the pharmacist or patient should know"
                value={rxNotes}
                onChange={(e) => setRxNotes(e.target.value)}
              />
            </div>
          )}
        </section>

        <section className="border-t border-rule pt-4">
          <DocumentsPanel patientId={patientId} myUserId={session?.user?.id} />
        </section>

        {error && (
          <p role="alert" className="rounded-md bg-[var(--color-signal-stop-bg)] px-3 py-2 text-sm text-[var(--color-signal-stop)]">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-rule pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={handleSave}>
            Save visit
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
