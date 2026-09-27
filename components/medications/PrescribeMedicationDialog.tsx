"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/Card";
import { UsersIcon } from "@/components/ui/Icons";
import { TextField } from "@/components/ui/Field";
import { apiGetPaged, ApiError } from "@/lib/api-client";

type PatientRow = {
  id: number;
  mrn: string | null;
  user: { name: string | null; phone: string; email: string };
};

/// Step 5–7 of the medication-to-prescription workflow: the doctor picks a
/// patient, and this dialog hands off to that patient's existing chart with
/// the medication name pre-filled — it never creates a prescription itself.
/// Whether this doctor may actually open that chart (and later prescribe for
/// it) is enforced server-side exactly as it already is for every other
/// entry point into a patient's chart; this dialog does not duplicate or
/// weaken that check.
export function PrescribeMedicationDialog({
  open,
  onClose,
  medicationName,
}: {
  open: boolean;
  onClose: () => void;
  medicationName: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [rows, setRows] = useState<PatientRow[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    if (!open) return;
    setRows(null);
    setErrorMessage(null);
    apiGetPaged<PatientRow[]>("/patients", { page: 1, pageSize: 20, q: debouncedQ || undefined })
      .then(({ data }) => setRows(data))
      .catch((err) => setErrorMessage(err instanceof ApiError ? err.message : "We couldn't load the patient directory."));
  }, [open, debouncedQ]);

  function choosePatient(patientId: number) {
    router.push(`/dashboard/doc/patients/${patientId}?prescribe=${encodeURIComponent(medicationName)}`);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Reference ${medicationName} in a prescription`}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-500">
          Choose the patient. Their chart will open with a new prescription started — you&apos;ll still need to enter and
          verify the dosage, frequency, and duration yourself.
        </p>

        <TextField
          label="Search patients"
          placeholder="Name, MRN, email or phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {errorMessage ? (
          <ErrorState message={errorMessage} onRetry={() => setDebouncedQ((v) => v)} />
        ) : rows === null ? (
          <LoadingRows rows={4} />
        ) : rows.length === 0 ? (
          <EmptyState icon={<UsersIcon />} title="No patients match that search" />
        ) : (
          <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto" aria-label="Patients">
            {rows.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => choosePatient(p.id)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-paper"
                >
                  <Avatar name={p.user.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink-900">{p.user.name ?? "Unnamed patient"}</span>
                    <span className="block truncate text-xs text-ink-500">{p.mrn ?? (p.user.phone || p.user.email)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
