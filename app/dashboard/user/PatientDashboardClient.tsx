"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { AppointmentStatusBadge, InvoiceStatusBadge, PrescriptionStatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader, EmptyState, ErrorState, LoadingRows, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiGet, apiSend, ApiError } from "@/lib/api-client";

type Stats = {
  scope: "patient";
  patientId: number | null;
  kpis: {
    upcomingAppointments: number;
    pastAppointments: number;
    activePrescriptions: number;
    outstandingAmount: string;
  };
  nextAppointment: {
    id: number;
    date: string;
    department: string;
    status: string;
    doctor: { user: { name: string | null } } | null;
  } | null;
};

type Appointment = {
  id: number;
  date: string;
  department: string;
  status: string;
  reason: string;
  doctor: { user: { name: string | null } } | null;
};

type Prescription = {
  id: number;
  issuedAt: string;
  status: string;
  doctor: { user: { name: string | null } };
  items: { id: number; medication: string; dosage: string; frequency: string }[];
};

type Invoice = {
  id: number;
  number: string;
  status: string;
  total: string;
  issuedAt: string;
  dueAt: string | null;
};

const TABS = ["Appointments", "Prescriptions", "Billing", "Documents"] as const;
type Tab = (typeof TABS)[number];

export default function PatientDashboardClient({ paidInvoiceNumber }: { paidInvoiceNumber?: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Appointments");

  const [stats, setStats] = useState<Stats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[] | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [onlinePaymentsEnabled, setOnlinePaymentsEnabled] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    apiGet<Stats>("/dashboard/stats").then(setStats).catch(() => setError("Couldn't load your overview."));
    apiGet<Appointment[]>("/appointments", { pageSize: 50 }).then(setAppointments).catch(() => {});
    apiGet<Prescription[]>("/prescriptions", { pageSize: 50 }).then(setPrescriptions).catch(() => {});
    apiGet<Invoice[]>("/invoices", { pageSize: 50 }).then(setInvoices).catch(() => {});
    apiGet<{ onlinePaymentsEnabled: boolean }>("/billing/config")
      .then((c) => setOnlinePaymentsEnabled(c.onlinePaymentsEnabled))
      .catch(() => {});
  }, [status]);

  async function payOnline(invoiceId: number) {
    setPayingId(invoiceId);
    try {
      const { url } = await apiSend<{ url: string }>("POST", `/invoices/${invoiceId}/checkout`);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start checkout.");
      setPayingId(null);
    }
  }

  async function cancelAppointment(id: number) {
    setCancellingId(id);
    try {
      await apiSend("PATCH", `/appointments/${id}`, { status: "CANCELLED" });
      setAppointments((prev) => prev?.map((a) => (a.id === id ? { ...a, status: "CANCELLED" } : a)) ?? null);
    } catch {
      // Leave the row as-is; the user can retry.
    } finally {
      setCancellingId(null);
    }
  }

  if (status !== "authenticated") return null;

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink-900">
        Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
      </h1>

      {paidInvoiceNumber && (
        <div className="mt-3 rounded-md bg-[var(--color-signal-ok-bg)] px-3 py-2 text-sm text-[var(--color-signal-ok)]">
          Payment received for invoice {paidInvoiceNumber}. It may take a moment to show as paid below.
        </div>
      )}

      {error && <ErrorState message={error} />}

      {stats && (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Upcoming" value={stats.kpis.upcomingAppointments} />
          <StatCard label="Past visits" value={stats.kpis.pastAppointments} />
          <StatCard label="Active prescriptions" value={stats.kpis.activePrescriptions} />
          <StatCard
            label="Outstanding"
            value={stats.kpis.outstandingAmount}
            tone={Number(stats.kpis.outstandingAmount) > 0 ? "wait" : "neutral"}
          />
        </div>
      )}

      {stats?.nextAppointment && (
        <Card className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-500">Next appointment</p>
            <p className="mt-0.5 font-medium text-ink-900">
              {new Date(stats.nextAppointment.date).toLocaleString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
              {stats.nextAppointment.doctor?.user.name && ` · Dr. ${stats.nextAppointment.doctor.user.name}`}
            </p>
          </div>
          <AppointmentStatusBadge status={stats.nextAppointment.status} />
        </Card>
      )}

      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-1 rounded-md border border-rule bg-surface p-1">
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
        <Link href="/appointment">
          <Button size="sm">Book appointment</Button>
        </Link>
      </div>

      <div className="mt-4">
        {tab === "Appointments" &&
          (appointments === null ? (
            <LoadingRows />
          ) : appointments.length === 0 ? (
            <EmptyState
              title="No appointments yet"
              body="Book your first appointment to see it here."
              action={
                <Link href="/appointment">
                  <Button size="sm">Book appointment</Button>
                </Link>
              }
            />
          ) : (
            <Card padded={false} className="overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-rule bg-paper text-xs text-ink-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium">Doctor</th>
                    <th className="px-4 py-2.5 font-medium">Department</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {appointments.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-3 font-mono text-ink-900">
                        {new Date(a.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3 text-ink-700">
                        {a.doctor?.user.name ? `Dr. ${a.doctor.user.name}` : "Unassigned"}
                      </td>
                      <td className="px-4 py-3 text-ink-700">{a.department}</td>
                      <td className="px-4 py-3">
                        <AppointmentStatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                          <button
                            onClick={() => cancelAppointment(a.id)}
                            disabled={cancellingId === a.id}
                            className="text-xs font-medium text-[var(--color-signal-stop)] hover:underline disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}

        {tab === "Prescriptions" &&
          (prescriptions === null ? (
            <LoadingRows />
          ) : prescriptions.length === 0 ? (
            <EmptyState title="No prescriptions yet" body="Prescriptions your doctor issues will appear here." />
          ) : (
            <div className="flex flex-col gap-3">
              {prescriptions.map((p) => (
                <Card key={p.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink-900">
                        Dr. {p.doctor.user.name} · {new Date(p.issuedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <PrescriptionStatusBadge status={p.status} />
                  </div>
                  <ul className="mt-3 divide-y divide-rule">
                    {p.items.map((i) => (
                      <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                        <span className="font-medium text-ink-900">{i.medication}</span>
                        <span className="font-mono text-ink-500">
                          {i.dosage} · {i.frequency}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          ))}

        {tab === "Billing" &&
          (invoices === null ? (
            <LoadingRows />
          ) : invoices.length === 0 ? (
            <EmptyState title="No invoices yet" body="Invoices from your visits will appear here." />
          ) : (
            <Card padded={false} className="overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-rule bg-paper text-xs text-ink-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Invoice</th>
                    <th className="px-4 py-2.5 font-medium">Issued</th>
                    <th className="px-4 py-2.5 font-medium">Due</th>
                    <th className="px-4 py-2.5 font-medium">Amount</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-3 font-mono text-ink-900">{inv.number}</td>
                      <td className="px-4 py-3 text-ink-700">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-ink-700">
                        {inv.dueAt ? new Date(inv.dueAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-ink-900">{inv.total}</td>
                      <td className="px-4 py-3">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {onlinePaymentsEnabled && (inv.status === "PENDING" || inv.status === "OVERDUE") && (
                          <button
                            onClick={() => payOnline(inv.id)}
                            disabled={payingId === inv.id}
                            className="text-xs font-medium text-accent-700 hover:underline disabled:opacity-50"
                          >
                            Pay online
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}

        {tab === "Documents" &&
          (stats?.patientId ? (
            <Card>
              <DocumentsPanel patientId={stats.patientId} myUserId={session?.user?.id} />
            </Card>
          ) : (
            <LoadingRows />
          ))}
      </div>
    </AppShell>
  );
}
