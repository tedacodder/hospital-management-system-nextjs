"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { FormAlert } from "@/components/auth/FormAlert";
import { PageHeader } from "@/components/patient/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, ErrorState } from "@/components/ui/Card";
import { TextAreaField } from "@/components/ui/Field";
import { CalendarIcon, CheckIcon, ClockIcon, StethoscopeIcon } from "@/components/ui/Icons";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { apiGet, apiSend } from "@/lib/api-client";
import { doctorLabel, formatDateTime, formatMoney, friendlyError } from "@/lib/patient-ui";
import { useApiResource } from "@/lib/use-api-resource";

type Department = { id: number; name: string };
type Doctor = {
  id: number;
  specialization: string;
  bio: string | null;
  yearsExperience: number | null;
  consultationFee: string | null;
  department: { id: number; name: string } | null;
  user: { name: string | null };
  isAcceptingNew: boolean;
};
type Slot = { start: string; available: boolean };

const DAY_CHIPS = 7;

// The day is a plain YYYY-MM-DD string exactly as it always was: it is what
// the slots endpoint receives (as `new Date(day).toISOString()`), so the
// booking rules on the server see the same input as before.
function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function dayChips(): Array<{ value: string; weekday: string; date: string }> {
  return Array.from({ length: DAY_CHIPS }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().slice(0, 10);
    // Labelled from the string at midday so the label can never drift a day.
    const label = new Date(`${value}T12:00:00`);
    return {
      value,
      weekday: i === 0 ? "Today" : label.toLocaleDateString([], { weekday: "short" }),
      date: label.toLocaleDateString([], { month: "short", day: "numeric" }),
    };
  });
}

function Step({
  number,
  title,
  hint,
  done,
  children,
}: {
  number: number;
  title: string;
  hint?: string;
  done?: boolean;
  children: ReactNode;
}) {
  return (
    <Card padded={false}>
      <div className="flex items-start gap-3.5 border-b border-rule px-4 py-4 sm:px-6">
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold transition-colors ${
            done ? "bg-accent-700 text-white" : "border border-rule-strong bg-paper text-ink-700"
          }`}
        >
          {done ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.4} /> : number}
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-ink-500">{hint}</p>}
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </Card>
  );
}

function DoctorOption({
  doctor: d,
  selected,
  onSelect,
}: {
  doctor: Doctor;
  selected: boolean;
  onSelect: () => void;
}) {
  const detail = [
    d.yearsExperience ? `${d.yearsExperience} ${d.yearsExperience === 1 ? "year" : "years"} experience` : null,
    d.consultationFee ? `Fee ${formatMoney(d.consultationFee)}` : null,
  ].filter(Boolean);

  return (
    <label className="relative block">
      <input
        type="radio"
        name="doctor"
        value={d.id}
        checked={selected}
        disabled={!d.isAcceptingNew}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        className="flex cursor-pointer gap-3.5 rounded-lg border border-rule bg-surface p-4 transition-[border-color,box-shadow,background-color] duration-150 hover:border-rule-strong peer-checked:border-accent-700 peer-checked:bg-accent-050/50 peer-checked:shadow-[0_0_0_1px_var(--color-accent-700)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-60"
      >
        <Avatar name={d.user.name} size="md" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[0.9375rem] font-semibold text-ink-900">{doctorLabel(d.user.name)}</span>
            {!d.isAcceptingNew && <Badge tone="neutral">Not accepting new patients</Badge>}
          </span>
          <span className="block text-sm text-ink-500">
            {d.specialization}
            {d.department ? ` · ${d.department.name}` : ""}
          </span>
          {d.bio && <span className="mt-1.5 line-clamp-2 block text-sm leading-relaxed text-ink-700">{d.bio}</span>}
          {detail.length > 0 && <span className="mt-1.5 block font-mono text-xs text-ink-500">{detail.join(" · ")}</span>}
        </span>
        <span
          aria-hidden="true"
          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
            selected ? "border-accent-700 bg-accent-700 text-white" : "border-control bg-white"
          }`}
        >
          {selected && <CheckIcon className="h-3 w-3" strokeWidth={2.6} />}
        </span>
      </span>
    </label>
  );
}

/// Booking is a three-step flow — doctor, day and time, reason — because that
/// mirrors how a real availability check works: you cannot pick a time until
/// you've picked who you're seeing and when they work. The summary beside it
/// (below it on phones) always shows what will be requested.
export default function AppointmentPageClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { push } = useToast();
  const authed = status === "authenticated";
  // Patients have a bottom tab bar on phones; the action bar sits above it.
  const hasTabBar = session?.user?.role === "PATIENT";

  const departments = useApiResource<Department[]>("/departments", undefined, authed);
  const doctorsResource = useApiResource<Doctor[]>("/doctors", { pageSize: 100 }, authed);
  const doctors = useMemo(() => doctorsResource.data ?? [], [doctorsResource.data]);

  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [doctorId, setDoctorId] = useState<number | "">("");
  const [day, setDay] = useState(todayString);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsError, setSlotsError] = useState(false);
  const [slotsNonce, setSlotsNonce] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chips = useMemo(dayChips, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const filteredDoctors = useMemo(
    () => (departmentId ? doctors.filter((d) => d.department?.id === departmentId) : doctors),
    [doctors, departmentId],
  );
  const doctor = doctors.find((d) => d.id === doctorId) ?? null;

  useEffect(() => {
    if (!doctorId || !day) {
      setSlots(null);
      return;
    }
    let cancelled = false;
    setSlots(null);
    setSlotsError(false);
    setSelectedSlot(null);
    apiGet<Slot[]>(`/doctors/${doctorId}/slots`, { date: new Date(day).toISOString() })
      .then((result) => {
        if (!cancelled) setSlots(result);
      })
      .catch(() => {
        if (!cancelled) setSlotsError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId, day, slotsNonce]);

  const canSubmit = Boolean(doctorId && selectedSlot && reason.trim());

  async function handleBook() {
    if (!doctorId || !selectedSlot || !reason.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      await apiSend("POST", "/appointments", {
        doctorId,
        department: doctor?.department?.name ?? doctor?.specialization ?? "General",
        date: selectedSlot,
        durationMinutes: 30,
        reason,
      });
      push("Appointment requested. You'll be notified once it's confirmed.");
      router.push("/dashboard/user");
    } catch (err) {
      setError(friendlyError(err, "Could not book that slot. Try another."));
      // Someone else may have just taken it — show the current picture.
      setSlotsNonce((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  }

  if (!authed) return null;

  const summary = (
    <dl className="space-y-4 text-sm">
      <div>
        <dt className="text-xs font-medium uppercase tracking-wider text-ink-500">Doctor</dt>
        <dd className="mt-1 flex items-center gap-2.5">
          {doctor ? (
            <>
              <Avatar name={doctor.user.name} size="sm" />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-ink-900">{doctorLabel(doctor.user.name)}</span>
                <span className="block truncate text-xs text-ink-500">{doctor.specialization}</span>
              </span>
            </>
          ) : (
            <span className="text-ink-500">Not chosen yet</span>
          )}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wider text-ink-500">When</dt>
        <dd className={`mt-1 ${selectedSlot ? "font-mono font-medium text-ink-900" : "text-ink-500"}`}>
          {selectedSlot ? formatDateTime(selectedSlot) : "Not chosen yet"}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wider text-ink-500">Reason</dt>
        <dd className={`mt-1 line-clamp-3 ${reason.trim() ? "text-ink-900" : "text-ink-500"}`}>
          {reason.trim() || "Not added yet"}
        </dd>
      </div>
    </dl>
  );

  return (
    <AppShell>
      <PageHeader
        title="Book an appointment"
        description="Choose a doctor, pick an open time, and tell us why you're coming. The clinic confirms your request."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          {/* 1 — Doctor */}
          <Step number={1} title="Choose a doctor" hint="Filter by department, then pick who you'd like to see." done={Boolean(doctor)}>
            {doctorsResource.error ? (
              <ErrorState message="We couldn't load the doctors. Check your connection and try again." onRetry={doctorsResource.reload} />
            ) : doctorsResource.data === null ? (
              <div className="space-y-3" role="status" aria-label="Loading doctors" aria-busy="true">
                <Skeleton className="h-9 w-2/3" />
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
              </div>
            ) : (
              <>
                {(departments.data?.length ?? 0) > 0 && (
                  <div className="-mx-4 mb-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
                    <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap" role="group" aria-label="Filter by department">
                      {[{ id: "" as const, name: "All departments" }, ...(departments.data ?? [])].map((d) => {
                        const active = departmentId === d.id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                              setDepartmentId(d.id);
                              setDoctorId("");
                            }}
                            className={`h-9 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors ${
                              active
                                ? "border-accent-700 bg-accent-700 text-white"
                                : "border-rule-strong bg-white text-ink-700 hover:border-ink-500"
                            }`}
                          >
                            {d.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {filteredDoctors.length === 0 ? (
                  <EmptyState
                    icon={<StethoscopeIcon />}
                    title="No doctors in this department"
                    body="Try another department, or choose all departments."
                  />
                ) : (
                  <fieldset>
                    <legend className="sr-only">Doctor</legend>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {filteredDoctors.map((d) => (
                        <DoctorOption key={d.id} doctor={d} selected={doctorId === d.id} onSelect={() => setDoctorId(d.id)} />
                      ))}
                    </div>
                  </fieldset>
                )}
              </>
            )}
          </Step>

          {/* 2 — Day and time */}
          <Step number={2} title="Pick a day and time" hint="Times come from the doctor's availability. Booked times can't be chosen." done={Boolean(selectedSlot)}>
            {!doctor ? (
              <p className="flex items-center gap-2 text-sm text-ink-500">
                <ClockIcon className="h-4 w-4" />
                Choose a doctor first to see their open times.
              </p>
            ) : (
              <div className="space-y-5">
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-ink-700">Day</legend>
                  <div className="-mx-4 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
                    <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap">
                      {chips.map((c) => (
                        <label key={c.value} className="relative">
                          <input
                            type="radio"
                            name="day"
                            value={c.value}
                            checked={day === c.value}
                            onChange={() => setDay(c.value)}
                            className="peer sr-only"
                          />
                          <span className="flex w-[4.25rem] cursor-pointer flex-col items-center rounded-lg border border-rule-strong bg-white py-2 transition-colors hover:border-ink-500 peer-checked:border-accent-700 peer-checked:bg-accent-700 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-600">
                            <span className="text-xs font-medium opacity-80">{c.weekday}</span>
                            <span className="font-mono text-sm font-semibold tabular-nums">{c.date}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <label htmlFor="day" className="text-sm text-ink-500">
                      Another date
                    </label>
                    <input
                      id="day"
                      type="date"
                      min={todayString()}
                      value={day}
                      onChange={(e) => e.target.value && setDay(e.target.value)}
                      className="h-11 rounded-lg border border-control bg-white px-3 text-[1rem] text-ink-900 transition-[border-color,box-shadow] hover:border-ink-500 focus-visible:border-accent-600 focus-visible:shadow-[0_0_0_4px_rgb(26_145_135/0.16)]"
                    />
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-ink-700">Available times</legend>
                  {slotsError ? (
                    <ErrorState message="We couldn't load the times for that day." onRetry={() => setSlotsNonce((n) => n + 1)} />
                  ) : slots === null ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="status" aria-label="Loading times" aria-busy="true">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-11" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <EmptyState
                      icon={<CalendarIcon />}
                      title="No hours set for that day"
                      body="Try a different day, or a different doctor."
                    />
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slots.map((s) => (
                        <label key={s.start} className="relative">
                          <input
                            type="radio"
                            name="slot"
                            value={s.start}
                            checked={selectedSlot === s.start}
                            disabled={!s.available}
                            onChange={() => setSelectedSlot(s.start)}
                            className="peer sr-only"
                          />
                          <span className="flex h-11 cursor-pointer items-center justify-center rounded-lg border border-rule-strong bg-white font-mono text-sm tabular-nums text-ink-900 transition-colors hover:border-accent-600 peer-checked:border-accent-700 peer-checked:bg-accent-700 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-600 peer-disabled:cursor-not-allowed peer-disabled:border-rule peer-disabled:bg-paper peer-disabled:text-ink-300 peer-disabled:line-through peer-disabled:hover:border-rule">
                            {new Date(s.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            {!s.available && <span className="sr-only"> (unavailable)</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </fieldset>
              </div>
            )}
          </Step>

          {/* 3 — Reason */}
          <Step number={3} title="Reason for your visit" hint="A sentence or two is enough." done={Boolean(selectedSlot && reason.trim())}>
            {selectedSlot ? (
              <TextAreaField
                fieldSize="lg"
                label="Reason for visit"
                required
                maxLength={1000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe the reason for your visit"
              />
            ) : (
              <p className="text-sm text-ink-500">Pick a time above and this field will open.</p>
            )}
          </Step>

          {error && <FormAlert tone="error">{error}</FormAlert>}
        </div>

        {/* Summary — beside the steps on large screens */}
        <aside className="hidden lg:sticky lg:top-24 lg:block" aria-label="Appointment summary">
          <Card>
            <h2 className="text-base font-semibold text-ink-900">Your appointment</h2>
            <div className="mt-4">{summary}</div>
            <Button className="mt-5 w-full" size="lg" disabled={!canSubmit} loading={submitting} onClick={handleBook}>
              {submitting ? "Requesting…" : "Request appointment"}
            </Button>
            <p className="mt-3 text-xs leading-relaxed text-ink-500">
              This sends a request. You&apos;ll be notified when the clinic confirms it.
            </p>
          </Card>
        </aside>
      </div>

      {/* Summary + action — phones. Sits above the tab bar. */}
      <div className={`pb-safe fixed inset-x-0 ${hasTabBar ? "bottom-16" : "bottom-0"} z-20 border-t border-rule bg-surface/95 p-3 backdrop-blur-md lg:hidden`} data-print="hide">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <p className="min-w-0 flex-1 text-sm">
            {doctor && selectedSlot ? (
              <>
                <span className="block truncate font-semibold text-ink-900">{doctorLabel(doctor.user.name)}</span>
                <span className="block truncate font-mono text-xs text-ink-500">{formatDateTime(selectedSlot)}</span>
              </>
            ) : (
              <span className="text-ink-500">Choose a doctor and a time</span>
            )}
          </p>
          <Button disabled={!canSubmit} loading={submitting} onClick={handleBook}>
            Request
          </Button>
        </div>
      </div>
      <div className={`${hasTabBar ? "h-20" : "h-16"} lg:hidden`} aria-hidden="true" />
    </AppShell>
  );
}
