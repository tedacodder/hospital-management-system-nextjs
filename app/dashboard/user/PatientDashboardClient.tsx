"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { FormAlert } from "@/components/auth/FormAlert";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { AppointmentCard } from "@/components/patient/AppointmentCard";
import { InvoiceCard } from "@/components/patient/InvoiceCard";
import { OverviewHero } from "@/components/patient/OverviewHero";
import { PrescriptionCard } from "@/components/patient/PrescriptionCard";
import { QuickActions, type QuickAction } from "@/components/patient/QuickActions";
import { RecordCard } from "@/components/patient/RecordCard";
import type {
  Appointment,
  DashboardStats,
  Invoice,
  MedicalRecord,
  Prescription,
} from "@/components/patient/types";
import { AppointmentStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card, EmptyState, ErrorState, StatCard } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import {
  CalendarIcon,
  ClockIcon,
  FileIcon,
  MessageIcon,
  PillIcon,
  PlusIcon,
  ReceiptIcon,
  RecordIcon,
} from "@/components/ui/Icons";
import { Skeleton } from "@/components/ui/Skeleton";
import { panelId, tabId, Tabs, type TabItem } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { apiSend } from "@/lib/api-client";
import {
  doctorLabel,
  formatDateTime,
  formatMoney,
  formatTimeRange,
  friendlyError,
  splitAppointments,
  splitPrescriptions,
} from "@/lib/patient-ui";
import { useApiResource } from "@/lib/use-api-resource";

type TabKey = "appointments" | "records" | "prescriptions" | "billing" | "documents";

const PREFIX = "dash";
const PAST_PREVIEW = 5;

function CardListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Loading" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-lg" />
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">{children}</h2>;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className="mt-0.5 text-sm leading-relaxed text-ink-900">{children}</dd>
    </div>
  );
}

/// Staff and admin may also open this dashboard (see page.tsx). Their session
/// has no patient chart, so the records tab and document upload are patient-only.
export default function PatientDashboardClient({ paidInvoiceNumber }: { paidInvoiceNumber?: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { push } = useToast();

  const authed = status === "authenticated";
  const isPatient = session?.user?.role === "PATIENT";

  const [tab, setTab] = useState<TabKey>("appointments");
  const [showAllPast, setShowAllPast] = useState(false);
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [toCancel, setToCancel] = useState<Appointment | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);

  const stats = useApiResource<DashboardStats>("/dashboard/stats", undefined, authed);
  const appointments = useApiResource<Appointment[]>("/appointments", { pageSize: 50 }, authed);
  const prescriptions = useApiResource<Prescription[]>("/prescriptions", { pageSize: 50 }, authed);
  const invoices = useApiResource<Invoice[]>("/invoices", { pageSize: 50 }, authed);
  const records = useApiResource<MedicalRecord[]>("/records", { pageSize: 50 }, authed && isPatient);
  const billingConfig = useApiResource<{ onlinePaymentsEnabled: boolean }>("/billing/config", undefined, authed);
  const onlinePaymentsEnabled = billingConfig.data?.onlinePaymentsEnabled ?? false;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function confirmCancel() {
    if (!toCancel) return;
    const target = toCancel;
    setCancellingId(target.id);
    try {
      await apiSend("PATCH", `/appointments/${target.id}`, { status: "CANCELLED" });
      appointments.setData((prev) => prev?.map((a) => (a.id === target.id ? { ...a, status: "CANCELLED" } : a)) ?? null);
      stats.refresh();
      setToCancel(null);
      push("Appointment cancelled.");
    } catch (err) {
      // Leave the row as-is; the user can retry, but they need to know why.
      push(friendlyError(err, "Couldn't cancel that appointment. Please try again."), "error");
    } finally {
      setCancellingId(null);
    }
  }

  async function payOnline(invoice: Invoice) {
    setPayingId(invoice.id);
    try {
      const { url } = await apiSend<{ url: string }>("POST", `/invoices/${invoice.id}/checkout`);
      window.location.href = url;
    } catch (err) {
      push(friendlyError(err, "Couldn't start checkout. Please try again."), "error");
      setPayingId(null);
    }
  }

  if (!authed) return null;

  const appointmentList = appointments.data;
  const { upcoming, past } = splitAppointments(appointmentList ?? []);
  const { active: activeRx, earlier: earlierRx } = splitPrescriptions(prescriptions.data ?? []);
  const unpaid = (invoices.data ?? []).filter((i) => i.status === "PENDING" || i.status === "OVERDUE");
  const visiblePast = showAllPast ? past : past.slice(0, PAST_PREVIEW);
  const nextDetail = stats.data?.nextAppointment
    ? appointmentList?.find((a) => a.id === stats.data?.nextAppointment?.id)
    : undefined;

  function jumpTo(next: TabKey) {
    setTab(next);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() =>
      document.getElementById("dash-tabs")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }),
    );
  }

  const tabs: TabItem<TabKey>[] = [
    { id: "appointments", label: "Appointments", count: upcoming.length },
    ...(isPatient ? [{ id: "records" as const, label: "Records" }] : []),
    { id: "prescriptions", label: "Prescriptions", count: activeRx.length },
    { id: "billing", label: "Billing", count: unpaid.length },
    { id: "documents", label: "Documents" },
  ];

  const actions: QuickAction[] = [
    { key: "book", title: "Book appointment", body: "Choose a doctor and an open time", icon: <PlusIcon />, href: "/appointment" },
    { key: "messages", title: "Messages", body: "Write to your care team", icon: <MessageIcon />, href: "/dashboard/messages" },
    {
      key: "billing",
      title: "Billing",
      body: unpaid.length > 0 ? `${unpaid.length} unpaid ${unpaid.length === 1 ? "invoice" : "invoices"}` : "Invoices and payments",
      icon: <ReceiptIcon />,
      onSelect: () => jumpTo("billing"),
    },
    {
      key: "documents",
      title: "Documents",
      body: "Upload or open your files",
      icon: <FileIcon />,
      onSelect: () => jumpTo("documents"),
    },
  ];

  const outstanding = stats.data ? Number(stats.data.kpis.outstandingAmount) : 0;

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8">
        {paidInvoiceNumber && (
          <FormAlert tone="success">
            Payment received for invoice {paidInvoiceNumber}. It may take a moment to show as paid below.
          </FormAlert>
        )}

        <OverviewHero name={session?.user?.name} next={stats.data?.nextAppointment ?? null} detail={nextDetail} />

        {stats.error && (
          <ErrorState message="We couldn't load your overview. Check your connection and try again." onRetry={stats.reload} />
        )}

        {stats.data ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Upcoming" value={stats.data.kpis.upcomingAppointments} icon={<CalendarIcon />} />
            <StatCard label="Past visits" value={stats.data.kpis.pastAppointments} icon={<ClockIcon />} />
            <StatCard label="Active prescriptions" value={stats.data.kpis.activePrescriptions} icon={<PillIcon />} />
            <StatCard
              label="Outstanding"
              value={formatMoney(stats.data.kpis.outstandingAmount)}
              tone={outstanding > 0 ? "wait" : "neutral"}
              sublabel={unpaid.length > 0 ? `${unpaid.length} unpaid ${unpaid.length === 1 ? "invoice" : "invoices"}` : undefined}
              icon={<ReceiptIcon />}
            />
          </div>
        ) : (
          !stats.error && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" role="status" aria-label="Loading overview" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[6.5rem] rounded-lg" />
              ))}
            </div>
          )
        )}

        <QuickActions label="Quick actions" actions={actions} />

        <section id="dash-tabs" aria-label="Your care" className="scroll-mt-20">
          <Tabs tabs={tabs} value={tab} onChange={setTab} prefix={PREFIX} label="Your care" />

          <div
            role="tabpanel"
            id={panelId(PREFIX, tab)}
            aria-labelledby={tabId(PREFIX, tab)}
            className="animate-fade pt-5"
            key={tab}
          >
            {tab === "appointments" &&
              (appointments.error ? (
                <ErrorState message="We couldn't load your appointments." onRetry={appointments.reload} />
              ) : appointmentList === null ? (
                <CardListSkeleton />
              ) : appointmentList.length === 0 ? (
                <EmptyState
                  icon={<CalendarIcon />}
                  title="No appointments yet"
                  body="Your booked visits will appear here, with the doctor, date and time."
                  action={
                    <ButtonLink href="/appointment">
                      <PlusIcon className="h-4 w-4" />
                      Book an appointment
                    </ButtonLink>
                  }
                />
              ) : (
                <div className="space-y-8">
                  <div>
                    <SectionLabel>Upcoming</SectionLabel>
                    {upcoming.length === 0 ? (
                      <EmptyState
                        icon={<CalendarIcon />}
                        title="No upcoming appointments"
                        action={
                          <ButtonLink href="/appointment" size="sm">
                            Book an appointment
                          </ButtonLink>
                        }
                      />
                    ) : (
                      <div className="grid gap-3 xl:grid-cols-2">
                        {upcoming.map((a) => (
                          <AppointmentCard
                            key={a.id}
                            appointment={a}
                            cancelling={cancellingId === a.id}
                            onDetails={setDetail}
                            onCancel={setToCancel}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {past.length > 0 && (
                    <div>
                      <SectionLabel>History</SectionLabel>
                      <div className="grid gap-3 xl:grid-cols-2">
                        {visiblePast.map((a) => (
                          <AppointmentCard
                            key={a.id}
                            muted
                            appointment={a}
                            cancelling={cancellingId === a.id}
                            onDetails={setDetail}
                            onCancel={setToCancel}
                          />
                        ))}
                      </div>
                      {past.length > PAST_PREVIEW && (
                        <Button variant="ghost" className="mt-3" onClick={() => setShowAllPast((v) => !v)}>
                          {showAllPast ? "Show fewer" : `Show ${past.length - PAST_PREVIEW} more`}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}

            {tab === "records" &&
              (records.error ? (
                <ErrorState message="We couldn't load your medical records." onRetry={records.reload} />
              ) : records.data === null ? (
                <CardListSkeleton />
              ) : records.data.length === 0 ? (
                <EmptyState
                  icon={<RecordIcon />}
                  title="Your medical records will appear here"
                  body="After a visit, your doctor's notes, diagnosis and treatment are added to your chart."
                />
              ) : (
                <ol className="space-y-4" aria-label="Medical records, newest first">
                  {records.data.map((r) => (
                    <RecordCard key={r.id} record={r} />
                  ))}
                </ol>
              ))}

            {tab === "prescriptions" &&
              (prescriptions.error ? (
                <ErrorState message="We couldn't load your prescriptions." onRetry={prescriptions.reload} />
              ) : prescriptions.data === null ? (
                <CardListSkeleton />
              ) : prescriptions.data.length === 0 ? (
                <EmptyState
                  icon={<PillIcon />}
                  title="No prescriptions yet"
                  body="Prescriptions your doctor issues will appear here, with dosage and instructions."
                />
              ) : (
                <div className="space-y-8">
                  {activeRx.length > 0 && (
                    <div>
                      <SectionLabel>Active</SectionLabel>
                      <div className="grid gap-3 xl:grid-cols-2">
                        {activeRx.map((p) => (
                          <PrescriptionCard key={p.id} prescription={p} />
                        ))}
                      </div>
                    </div>
                  )}
                  {earlierRx.length > 0 && (
                    <div>
                      <SectionLabel>Earlier</SectionLabel>
                      <div className="grid gap-3 xl:grid-cols-2">
                        {earlierRx.map((p) => (
                          <PrescriptionCard key={p.id} prescription={p} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

            {tab === "billing" &&
              (invoices.error ? (
                <ErrorState message="We couldn't load your invoices." onRetry={invoices.reload} />
              ) : invoices.data === null ? (
                <CardListSkeleton />
              ) : invoices.data.length === 0 ? (
                <EmptyState
                  icon={<ReceiptIcon />}
                  title="No invoices yet"
                  body="Invoices from your visits will appear here, itemised, with your payment history."
                />
              ) : (
                <div className="grid gap-3 xl:grid-cols-2">
                  {invoices.data.map((inv) => (
                    <InvoiceCard
                      key={inv.id}
                      invoice={inv}
                      onlinePaymentsEnabled={onlinePaymentsEnabled}
                      paying={payingId === inv.id}
                      onPay={payOnline}
                    />
                  ))}
                </div>
              ))}

            {tab === "documents" &&
              (stats.data?.patientId ? (
                <Card>
                  <DocumentsPanel patientId={stats.data.patientId} myUserId={session?.user?.id} />
                </Card>
              ) : stats.data ? (
                <EmptyState
                  icon={<FileIcon />}
                  title="Documents belong to patient accounts"
                  body="This account has no patient chart, so there is nothing to upload or view here."
                />
              ) : stats.error ? (
                <ErrorState message="We couldn't load your documents." onRetry={stats.reload} />
              ) : (
                <CardListSkeleton rows={2} />
              ))}
          </div>
        </section>
      </div>

      {/* Appointment details */}
      <Dialog open={detail !== null} onClose={() => setDetail(null)} title="Appointment details">
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-sm text-ink-900">{formatDateTime(detail.date)}</p>
              <AppointmentStatusBadge status={detail.status} />
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailRow label="Time">{formatTimeRange(detail.date, detail.durationMinutes)}</DetailRow>
              <DetailRow label="Duration">{detail.durationMinutes} minutes</DetailRow>
              <DetailRow label="Doctor">{doctorLabel(detail.doctor?.user.name)}</DetailRow>
              <DetailRow label="Department">
                {detail.doctor?.specialization ? `${detail.doctor.specialization} · ` : ""}
                {detail.department}
              </DetailRow>
            </dl>
            <dl className="space-y-4">
              <DetailRow label="Reason for visit">{detail.reason}</DetailRow>
              {detail.notes && <DetailRow label="Notes">{detail.notes}</DetailRow>}
              {detail.cancelReason && <DetailRow label="Cancellation reason">{detail.cancelReason}</DetailRow>}
            </dl>
            <div className="flex flex-col-reverse gap-2 border-t border-rule pt-4 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setDetail(null)}>
                Close
              </Button>
              {(detail.status === "PENDING" || detail.status === "CONFIRMED") && (
                <Button
                  variant="danger"
                  onClick={() => {
                    setToCancel(detail);
                    setDetail(null);
                  }}
                >
                  Cancel appointment
                </Button>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Cancel confirmation */}
      <Dialog open={toCancel !== null} onClose={() => (cancellingId === null ? setToCancel(null) : undefined)} title="Cancel this appointment?">
        {toCancel && (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-ink-700">
              Your appointment with <span className="font-medium text-ink-900">{doctorLabel(toCancel.doctor?.user.name)}</span> on{" "}
              <span className="font-medium text-ink-900">{formatDateTime(toCancel.date)}</span> will be cancelled and the time
              released. To see the doctor again you&apos;ll need to book a new appointment.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" disabled={cancellingId !== null} onClick={() => setToCancel(null)}>
                Keep appointment
              </Button>
              <Button variant="danger" loading={cancellingId === toCancel.id} onClick={confirmCancel}>
                Cancel appointment
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </AppShell>
  );
}
