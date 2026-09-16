"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Dialog } from "@/components/ui/Dialog";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { apiSend, ApiError } from "@/lib/api-client";

type Props = {
  open: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  appointmentId?: number;
  onSaved: () => void;
};

type MedLine = { medication: string; dosage: string; frequency: string; durationDays: string };

const emptyLine = (): MedLine => ({ medication: "", dosage: "", frequency: "", durationDays: "" });

/// One dialog, two sections: a visit note (medical record) and, optionally, a
/// prescription with one or more medication lines. Saved as two API calls
/// because they're two clinical acts, even though they happen in one visit.
export function VisitDialog({ open, onClose, patientId, patientName, appointmentId, onSaved }: Props) {
  const { push } = useToast();
  const { data: session } = useSession();
  const [diagnosis, setDiagnosis] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [includeRx, setIncludeRx] = useState(false);
  const [lines, setLines] = useState<MedLine[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setDiagnosis("");
    setSymptoms("");
    setTreatment("");
    setNotes("");
    setIncludeRx(false);
    setLines([emptyLine()]);
    setError(null);
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
          }));
        if (items.length > 0) {
          await apiSend("POST", "/prescriptions", {
            patientId,
            medicalRecordId: record.id,
            appointmentId,
            items,
          });
        }
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
      <div className="flex flex-col gap-4">
        <TextField label="Diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
        <TextAreaField label="Symptoms" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
        <TextAreaField label="Treatment" value={treatment} onChange={(e) => setTreatment(e.target.value)} />
        <TextAreaField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="border-t border-rule pt-4">
          <DocumentsPanel patientId={patientId} myUserId={session?.user?.id} />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
          <input type="checkbox" checked={includeRx} onChange={(e) => setIncludeRx(e.target.checked)} />
          Issue a prescription with this visit
        </label>

        {includeRx && (
          <div className="flex flex-col gap-3 rounded-md border border-rule p-3">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-4 gap-2">
                <TextField
                  label="Medication"
                  value={line.medication}
                  onChange={(e) => {
                    const next = [...lines];
                    next[i] = { ...next[i], medication: e.target.value };
                    setLines(next);
                  }}
                />
                <TextField
                  label="Dosage"
                  value={line.dosage}
                  onChange={(e) => {
                    const next = [...lines];
                    next[i] = { ...next[i], dosage: e.target.value };
                    setLines(next);
                  }}
                />
                <TextField
                  label="Frequency"
                  value={line.frequency}
                  onChange={(e) => {
                    const next = [...lines];
                    next[i] = { ...next[i], frequency: e.target.value };
                    setLines(next);
                  }}
                />
                <TextField
                  label="Days"
                  inputMode="numeric"
                  value={line.durationDays}
                  onChange={(e) => {
                    const next = [...lines];
                    next[i] = { ...next[i], durationDays: e.target.value };
                    setLines(next);
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLines([...lines, emptyLine()])}
              className="self-start text-xs font-medium text-accent-700 hover:underline"
            >
              + Add another medication
            </button>
          </div>
        )}

        {error && (
          <p className="rounded-md bg-[var(--color-signal-stop-bg)] px-3 py-2 text-sm text-[var(--color-signal-stop)]">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
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
