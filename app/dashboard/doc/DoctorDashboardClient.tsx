"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AppointmentStatusBadge } from "@/components/ui/Badge";
import { Card, EmptyState, ErrorState, LoadingRows, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiGet, apiSend } from "@/lib/api-client";
import { AvailabilityEditor } from "./AvailabilityEditor";
import { VisitDialog } from "./VisitDialog";

type Stats = {
  scope: "doctor";
  doctorId: number | null;
  kpis: {
    todaysAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    totalPatients: number;
  };
  todaysSchedule: {
    id: number;
    date: string;
    status: string;
    reason: string;
    patient: { id: number; mrn: string | null; user: { name: string | null } };
  }[];
};

type PatientRow = {
  id: number;
  mrn: string | null;
  createdAt: string;
  user: { name: string | null; email: string; phone: string };
  _count: { appointments: number };
};

const TABS = ["Today's schedule", "My patients", "Availability"] as const;
type Tab = (typeof TABS)[number];

export default function DoctorDashboardClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Today's schedule");

  const [stats, setStats] = useState<Stats | null>(null);
  const [patients, setPatients] = useState<PatientRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [visitFor, setVisitFor] = useState<{ id: number; name: string; appointmentId?: number } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  function loadStats() {
    apiGet<Stats>("/dashboard/stats").then(setStats).catch(() => setError("Couldn't load your schedule."));
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    loadStats();
    apiGet<PatientRow[]>("/patients", { pageSize: 100 }).then(setPatients).catch(() => {});
  }, [status]);

  async function setStatus(id: number, next: "CONFIRMED" | "COMPLETED" | "CANCELLED") {
    setBusyId(id);
    try {
      await apiSend("PATCH", `/appointments/${id}`, { status: next });
      loadStats();
    } finally {
      setBusyId(null);
    }
  }

  if (status !== "authenticated") return null;

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink-900">
        {session?.user?.name ? `Dr. ${session.user.name.split(" ").slice(-1)}` : "Your schedule"}
      </h1>

      {error && <ErrorState message={error} />}

      {stats && (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Today" value={stats.kpis.todaysAppointments} />
          <StatCard label="Upcoming" value={stats.kpis.upcomingAppointments} />
          <StatCard label="Completed" value={stats.kpis.completedAppointments} />
          <StatCard label="Patients" value={stats.kpis.totalPatients} />
        </div>
      )}

      <div className="mt-6 flex gap-1 rounded-md border border-rule bg-surface p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-accent-700 text-white" : "text-ink-700 hover:bg-ink-900/5"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Today's schedule" && (
        <div className="mt-4">
          {!stats ? (
            <LoadingRows />
          ) : stats.todaysSchedule.length === 0 ? (
            <EmptyState title="Nothing on your schedule today" body="Confirmed appointments for today will appear here." />
          ) : (
            <div className="flex flex-col gap-3">
              {stats.todaysSchedule.map((a) => (
                <Card key={a.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-ink-900">
                      {new Date(a.date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </p>
                    <p className="truncate text-sm text-ink-900">
                      {a.patient.user.name}{" "}
                      <span className="text-ink-500">
                        {a.patient.mrn && `· ${a.patient.mrn}`}
                      </span>
                    </p>
                    <p className="truncate text-xs text-ink-500">{a.reason}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <AppointmentStatusBadge status={a.status} />
                    {a.status === "PENDING" && (
                      <Button size="sm" variant="secondary" loading={busyId === a.id} onClick={() => setStatus(a.id, "CONFIRMED")}>
                        Confirm
                      </Button>
                    )}
                    {a.status === "CONFIRMED" && (
                      <Button
                        size="sm"
                        onClick={() => setVisitFor({ id: a.patient.id, name: a.patient.user.name ?? "Patient", appointmentId: a.id })}
                      >
                        Start visit
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "My patients" && (
        <div className="mt-4">
          {patients === null ? (
            <LoadingRows />
          ) : patients.length === 0 ? (
            <EmptyState title="No patients yet" body="Patients you've seen will appear here." />
          ) : (
            <Card padded={false} className="overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-rule bg-paper text-xs text-ink-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">MRN</th>
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Contact</th>
                    <th className="px-4 py-2.5 font-medium">Visits</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {patients.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-mono text-ink-900">{p.mrn}</td>
                      <td className="px-4 py-3 text-ink-900">{p.user.name}</td>
                      <td className="px-4 py-3 text-ink-500">{p.user.phone || p.user.email}</td>
                      <td className="px-4 py-3 text-ink-700">{p._count.appointments}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setVisitFor({ id: p.id, name: p.user.name ?? "Patient" })}
                          className="text-xs font-medium text-accent-700 hover:underline"
                        >
                          Add visit note
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {tab === "Availability" &&
        (stats?.doctorId ? (
          <div className="mt-4">
            <AvailabilityEditor doctorId={stats.doctorId} />
          </div>
        ) : (
          <div className="mt-4">
            <LoadingRows rows={3} />
          </div>
        ))}

      {visitFor && (
        <VisitDialog
          open
          onClose={() => setVisitFor(null)}
          patientId={visitFor.id}
          patientName={visitFor.name}
          appointmentId={visitFor.appointmentId}
          onSaved={loadStats}
        />
      )}
    </AppShell>
  );
}
