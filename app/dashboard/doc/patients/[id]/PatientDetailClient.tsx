"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/AppShell";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { PrescriptionCard } from "@/components/patient/PrescriptionCard";
import { RecordCard } from "@/components/patient/RecordCard";
import type { Appointment, MedicalRecord, Prescription } from "@/components/patient/types";
import type { PatientDetail } from "@/components/doctor/types";
import { AppointmentStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, ErrorState, LoadingRows } from "@/components/ui/Card";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClipboardIcon,
  IdCardIcon,
  PhoneIcon,
  PillIcon,
  PlusIcon,
  RecordIcon,
  ShieldIcon,
} from "@/components/ui/Icons";
import { panelId, tabId, Tabs, type TabItem } from "@/components/ui/Tabs";
import { apiGet } from "@/lib/api-client";
import { formatDate, formatDateTime, friendlyError, splitPrescriptions } from "@/lib/patient-ui";
import { VisitDialog } from "../../VisitDialog";

type TabKey = "overview" | "records" | "prescriptions" | "appointments" | "documents";
const PREFIX = "chart";

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink-900">{value || "—"}</dd>
    </div>
  );
}

export default function PatientDetailClient() {
  const params = useParams<{ id: string }>();
  const patientId = Number(params.id);
  const { data: session } = useSession();

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [records, setRecords] = useState<MedicalRecord[] | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[] | null>(null);
  const [listError, setListError] = useState(false);

  const [tab, setTab] = useState<TabKey>("overview");
  const [visitOpen, setVisitOpen] = useState(false);

  function loadClinicalData() {
    setListError(false);
    Promise.all([
      apiGet<Appointment[]>("/appointments", { patientId, pageSize: 50 }),
      apiGet<MedicalRecord[]>("/records", { patientId, pageSize: 50 }),
      apiGet<Prescription[]>("/prescriptions", { patientId, pageSize: 50 }),
    ])
      .then(([a, r, p]) => {
        setAppointments(a.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime()));
        setRecords(r);
        setPrescriptions(p);
      })
      .catch(() => setListError(true));
  }

  useEffect(() => {
    if (!Number.isFinite(patientId)) return;
    apiGet<PatientDetail>(`/patients/${patientId}`)
      .then((p) => {
        setPatient(p);
        setAccessError(null);
        loadClinicalData();
      })
      .catch((err) => {
        setAccessError(friendlyError(err, "We couldn't load this patient's chart."));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const tabs: TabItem<TabKey>[] = [
    { id: "overview", label: "Overview" },
    { id: "records", label: "Records", count: records?.length },
    { id: "prescriptions", label: "Prescriptions", count: prescriptions?.length },
    { id: "appointments", label: "Appointments", count: appointments?.length },
    { id: "documents", label: "Documents" },
  ];

  if (accessError) {
    return (
      <AppShell>
        <Link href="/dashboard/doc/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-accent-700">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to patients
        </Link>
        <ErrorState message={accessError} />
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell>
        <LoadingRows rows={5} />
      </AppShell>
    );
  }

  const { active: activeRx, earlier: earlierRx } = splitPrescriptions(prescriptions ?? []);

  return (
    <AppShell>
      <Link href="/dashboard/doc/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-accent-700">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to patients
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.025em] text-ink-900 sm:text-[1.75rem]">{patient.user.name ?? "Unnamed patient"}</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            {patient.mrn && <span className="font-mono">{patient.mrn}</span>}
            {patient.user.age && ` · ${patient.user.age} yrs`}
            {patient.user.gender && ` · ${patient.user.gender}`}
            {patient.bloodType && ` · ${patient.bloodType}`}
          </p>
        </div>
        <Button onClick={() => setVisitOpen(true)}>
          <PlusIcon className="h-4 w-4" />
          New visit note
        </Button>
      </div>

      {patient.allergies && (
        <div className="mb-6 flex items-start gap-2.5 rounded-md border border-[var(--color-signal-stop)]/20 bg-[var(--color-signal-stop-bg)] px-4 py-3">
          <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-signal-stop)]" />
          <p className="text-sm text-[var(--color-signal-stop)]">
            <span className="font-semibold">Allergies: </span>
            {patient.allergies}
          </p>
        </div>
      )}

      <Tabs tabs={tabs} value={tab} onChange={setTab} prefix={PREFIX} label="Patient chart sections" />

      <div className="mt-5">
        {tab === "overview" && (
          <div id={panelId(PREFIX, "overview")} role="tabpanel" aria-labelledby={tabId(PREFIX, "overview")} className="grid gap-4 sm:grid-cols-2">
            <Card>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-900">
                <IdCardIcon className="h-4 w-4 text-ink-500" />
                Patient details
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <InfoRow label="Date of birth" value={patient.dateOfBirth ? formatDate(patient.dateOfBirth) : null} />
                <InfoRow label="Blood type" value={patient.bloodType} />
                <InfoRow label="Gender" value={patient.user.gender} />
                <InfoRow label="Registered" value={formatDate(patient.createdAt)} />
              </dl>
            </Card>

            <Card>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-900">
                <PhoneIcon className="h-4 w-4 text-ink-500" />
                Contact
              </h3>
              <dl className="grid gap-3">
                <InfoRow label="Phone" value={patient.user.phone} />
                <InfoRow label="Email" value={patient.user.email} />
                <InfoRow label="Address" value={patient.user.address} />
              </dl>
            </Card>

            <Card>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-900">
                <ShieldIcon className="h-4 w-4 text-ink-500" />
                Emergency contact
              </h3>
              <dl className="grid gap-3">
                <InfoRow label="Name" value={patient.emergencyContactName} />
                <InfoRow label="Phone" value={patient.emergencyContactPhone} />
                <InfoRow label="Relation" value={patient.emergencyContactRelation} />
              </dl>
            </Card>

            <Card>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-900">
                <ClipboardIcon className="h-4 w-4 text-ink-500" />
                History
              </h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{patient.history || "No history on file."}</p>
            </Card>
          </div>
        )}

        {tab === "records" && (
          <div id={panelId(PREFIX, "records")} role="tabpanel" aria-labelledby={tabId(PREFIX, "records")}>
            {listError ? (
              <ErrorState message="We couldn't load this patient's records." onRetry={loadClinicalData} />
            ) : records === null ? (
              <LoadingRows rows={3} />
            ) : records.length === 0 ? (
              <EmptyState icon={<RecordIcon />} title="No records yet" body="Visit notes you write for this patient will appear here." />
            ) : (
              <ol className="space-y-4" aria-label="Medical records, newest first">
                {records.map((r) => (
                  <RecordCard key={r.id} record={r} />
                ))}
              </ol>
            )}
          </div>
        )}

        {tab === "prescriptions" && (
          <div id={panelId(PREFIX, "prescriptions")} role="tabpanel" aria-labelledby={tabId(PREFIX, "prescriptions")}>
            {listError ? (
              <ErrorState message="We couldn't load this patient's prescriptions." onRetry={loadClinicalData} />
            ) : prescriptions === null ? (
              <LoadingRows rows={3} />
            ) : prescriptions.length === 0 ? (
              <EmptyState icon={<PillIcon />} title="No prescriptions yet" body="Prescriptions issued for this patient will appear here." />
            ) : (
              <div className="flex flex-col gap-5">
                {activeRx.length > 0 && (
                  <div>
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink-500">Active</p>
                    <div className="grid gap-3 xl:grid-cols-2">
                      {activeRx.map((p) => (
                        <PrescriptionCard key={p.id} prescription={p} />
                      ))}
                    </div>
                  </div>
                )}
                {earlierRx.length > 0 && (
                  <div>
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-ink-500">Earlier</p>
                    <div className="grid gap-3 xl:grid-cols-2">
                      {earlierRx.map((p) => (
                        <PrescriptionCard key={p.id} prescription={p} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "appointments" && (
          <div id={panelId(PREFIX, "appointments")} role="tabpanel" aria-labelledby={tabId(PREFIX, "appointments")}>
            {listError ? (
              <ErrorState message="We couldn't load this patient's appointments." onRetry={loadClinicalData} />
            ) : appointments === null ? (
              <LoadingRows rows={3} />
            ) : appointments.length === 0 ? (
              <EmptyState icon={<CalendarIcon />} title="No appointments yet" body="This patient has no appointments with you yet." />
            ) : (
              <Card padded={false} className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-rule bg-paper text-xs text-ink-500">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Date</th>
                        <th className="px-4 py-2.5 font-medium">Reason</th>
                        <th className="px-4 py-2.5 font-medium">Department</th>
                        <th className="px-4 py-2.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule">
                      {appointments.map((a) => (
                        <tr key={a.id}>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-700">{formatDateTime(a.date)}</td>
                          <td className="px-4 py-3 text-ink-900">{a.reason}</td>
                          <td className="px-4 py-3 text-ink-500">{a.department}</td>
                          <td className="px-4 py-3">
                            <AppointmentStatusBadge status={a.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {tab === "documents" && (
          <div id={panelId(PREFIX, "documents")} role="tabpanel" aria-labelledby={tabId(PREFIX, "documents")}>
            <Card>
              <DocumentsPanel patientId={patientId} myUserId={session?.user?.id} />
            </Card>
          </div>
        )}
      </div>

      <VisitDialog
        open={visitOpen}
        onClose={() => setVisitOpen(false)}
        patientId={patientId}
        patientName={patient.user.name ?? "Patient"}
        onSaved={loadClinicalData}
      />
    </AppShell>
  );
}
