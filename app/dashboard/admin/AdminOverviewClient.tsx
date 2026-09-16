"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AppShell } from "@/components/AppShell";
import { AppointmentStatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader, ErrorState, LoadingRows, StatCard } from "@/components/ui/Card";
import { apiGet } from "@/lib/api-client";

type Stats = {
  scope: "staff";
  kpis: {
    totalPatients: number;
    activeDoctors: number;
    departments: number;
    todaysAppointments: number;
    upcomingAppointments: number;
    outstandingInvoices: number;
    outstandingAmount: string;
  };
  appointmentsByStatus: { status: string; count: number }[];
  appointmentTrend: { date: string; count: number }[];
  recentPatients: { id: number; mrn: string | null; createdAt: string; user: { name: string | null } }[];
  recentAppointments: {
    id: number;
    date: string;
    status: string;
    department: string;
    patient: { user: { name: string | null } };
  }[];
};

export default function AdminOverviewClient() {
  const { status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    apiGet<Stats>("/dashboard/stats").then(setStats).catch(() => setError("Couldn't load the dashboard."));
  }, [status]);

  if (status !== "authenticated") return null;

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink-900">Overview</h1>

      {error && <ErrorState message={error} />}

      {!stats ? (
        <div className="mt-5">
          <LoadingRows rows={4} />
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Patients" value={stats.kpis.totalPatients} />
            <StatCard label="Doctors" value={stats.kpis.activeDoctors} />
            <StatCard label="Departments" value={stats.kpis.departments} />
            <StatCard label="Today" value={stats.kpis.todaysAppointments} />
            <StatCard label="Upcoming" value={stats.kpis.upcomingAppointments} />
            <StatCard
              label="Outstanding"
              value={stats.kpis.outstandingAmount}
              sublabel={`${stats.kpis.outstandingInvoices} invoice(s)`}
              tone={stats.kpis.outstandingInvoices > 0 ? "wait" : "neutral"}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Appointments, last 30 days" />
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.appointmentTrend}>
                    <CartesianGrid stroke="var(--color-rule)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => new Date(d).toLocaleDateString([], { day: "numeric", month: "short" })}
                      tick={{ fontSize: 11, fill: "var(--color-ink-500)" }}
                      interval={4}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-ink-500)" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip
                      labelFormatter={(d) => new Date(d as string).toLocaleDateString()}
                      contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: "var(--color-rule)" }}
                    />
                    <Line type="monotone" dataKey="count" stroke="var(--color-accent-600)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="By status" />
              <div className="flex flex-col gap-2">
                {stats.appointmentsByStatus.map((s) => (
                  <div key={s.status} className="flex items-center justify-between text-sm">
                    <AppointmentStatusBadge status={s.status} />
                    <span className="font-mono font-medium text-ink-900">{s.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Recently registered patients" />
              {stats.recentPatients.length === 0 ? (
                <p className="text-sm text-ink-500">No patients yet.</p>
              ) : (
                <ul className="divide-y divide-rule">
                  {stats.recentPatients.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-ink-900">{p.user.name}</span>
                      <span className="font-mono text-ink-500">{p.mrn}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Recent appointments" />
              {stats.recentAppointments.length === 0 ? (
                <p className="text-sm text-ink-500">No appointments yet.</p>
              ) : (
                <ul className="divide-y divide-rule">
                  {stats.recentAppointments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-ink-900">{a.patient.user.name}</span>
                      <AppointmentStatusBadge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}
