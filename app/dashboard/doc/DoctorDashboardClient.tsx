"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DoctorHeader } from "@/components/doctor/DoctorHeader";
import { DoctorMessagesPreview } from "@/components/doctor/DoctorMessagesPreview";
import { TodaySchedule } from "@/components/doctor/TodaySchedule";
import type { ConversationSummary, DoctorStats, TodayAppointment } from "@/components/doctor/types";
import { QuickActions, type QuickAction } from "@/components/patient/QuickActions";
import { Card, CardHeader, ErrorState, StatCard } from "@/components/ui/Card";
import { CalendarIcon, ClockIcon, MessageIcon, UsersIcon } from "@/components/ui/Icons";
import { apiGet, apiSend, ApiError } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { VisitDialog } from "./VisitDialog";

export default function DoctorDashboardClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { push } = useToast();

  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [visitFor, setVisitFor] = useState<{
    id: number;
    name: string;
    appointmentId?: number;
    context?: string;
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const loadStats = useCallback(() => {
    apiGet<DoctorStats>("/dashboard/stats")
      .then((s) => {
        setStats(s);
        setError(null);
      })
      .catch(() => setError("Couldn't load your schedule."));
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadStats();
    apiGet<ConversationSummary[]>("/conversations").then(setConversations).catch(() => {});
  }, [status, loadStats]);

  async function setStatus(id: number, next: "CONFIRMED" | "NO_SHOW") {
    setBusyId(id);
    try {
      await apiSend("PATCH", `/appointments/${id}`, { status: next });
      loadStats();
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't update that appointment. Please try again.", "error");
    } finally {
      setBusyId(null);
    }
  }

  function startVisit(a: TodayAppointment) {
    setVisitFor({
      id: a.patient.id,
      name: a.patient.user.name ?? "Patient",
      appointmentId: a.id,
      context: `Today's appointment · ${a.reason}`,
    });
  }

  if (status !== "authenticated") return null;

  const unreadMessages = conversations?.filter((c) => c.hasUnread).length ?? 0;
  const pendingCount = stats?.todaysSchedule.filter((a) => a.status === "PENDING").length ?? 0;

  const quickActions: QuickAction[] = [
    { key: "patients", title: "Patient directory", body: "Search every registered patient", icon: <UsersIcon />, href: "/dashboard/doc/patients" },
    { key: "availability", title: "Availability", body: "Set the hours you see patients", icon: <ClockIcon />, href: "/dashboard/doc/availability" },
    { key: "messages", title: "Messages", body: unreadMessages > 0 ? `${unreadMessages} unread` : "Talk with patients and staff", icon: <MessageIcon />, href: "/dashboard/messages" },
    { key: "profile", title: "My profile", body: "Update your details and password", icon: <CalendarIcon />, href: "/dashboard/profile" },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <DoctorHeader
          name={session?.user?.name}
          todaysCount={stats?.kpis.todaysAppointments ?? 0}
          pendingCount={pendingCount}
          unreadMessages={unreadMessages}
        />

        {error && <ErrorState message={error} onRetry={loadStats} />}

        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Today" value={stats.kpis.todaysAppointments} icon={<CalendarIcon />} />
            <StatCard label="Upcoming" value={stats.kpis.upcomingAppointments} icon={<ClockIcon />} />
            <StatCard label="Completed" value={stats.kpis.completedAppointments} icon={<CalendarIcon />} />
            <StatCard label="Patients seen" value={stats.kpis.totalPatients} icon={<UsersIcon />} />
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Card padded={false}>
              <div className="px-5 pt-5">
                <CardHeader title="Today's schedule" eyebrow={stats ? `${stats.kpis.todaysAppointments} appointment${stats.kpis.todaysAppointments === 1 ? "" : "s"}` : undefined} />
              </div>
              <div className="px-5 pb-5">
                <TodaySchedule
                  appointments={stats?.todaysSchedule ?? null}
                  busyId={busyId}
                  onConfirm={(id) => setStatus(id, "CONFIRMED")}
                  onNoShow={(id) => setStatus(id, "NO_SHOW")}
                  onStartVisit={startVisit}
                />
              </div>
            </Card>
          </div>

          <DoctorMessagesPreview conversations={conversations} myId={session?.user?.id} />
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink-900">Quick actions</h2>
          <QuickActions label="Quick actions" actions={quickActions} />
        </div>
      </div>

      {visitFor && (
        <VisitDialog
          open
          onClose={() => setVisitFor(null)}
          patientId={visitFor.id}
          patientName={visitFor.name}
          appointmentId={visitFor.appointmentId}
          appointmentContext={visitFor.context}
          onSaved={loadStats}
        />
      )}
    </AppShell>
  );
}
