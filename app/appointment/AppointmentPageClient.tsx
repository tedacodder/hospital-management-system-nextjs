"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, EmptyState, LoadingRows } from "@/components/ui/Card";
import { SelectField, TextAreaField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { apiGet, apiSend, ApiError } from "@/lib/api-client";

type Department = { id: number; name: string };
type Doctor = {
  id: number;
  specialization: string;
  department: { id: number; name: string } | null;
  user: { name: string | null };
  isAcceptingNew: boolean;
};
type Slot = { start: string; available: boolean };

/// Booking is a four-step funnel — department, doctor, day, slot — because that
/// mirrors how a real availability check works: you cannot pick a time until
/// you've picked who you're seeing and when they work.
export default function AppointmentPageClient() {
  const { status } = useSession();
  const router = useRouter();
  const { push } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [doctorId, setDoctorId] = useState<number | "">("");
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    apiGet<Department[]>("/departments").then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    apiGet<Doctor[]>("/doctors", { pageSize: 100 })
      .then(setDoctors)
      .catch(() => {});
  }, []);

  const filteredDoctors = useMemo(
    () => (departmentId ? doctors.filter((d) => d.department?.id === departmentId) : doctors),
    [doctors, departmentId],
  );

  useEffect(() => {
    if (!doctorId || !day) {
      setSlots(null);
      return;
    }
    setSlotsLoading(true);
    setSelectedSlot(null);
    apiGet<Slot[]>(`/doctors/${doctorId}/slots`, { date: new Date(day).toISOString() })
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [doctorId, day]);

  async function handleBook() {
    if (!doctorId || !selectedSlot || !reason.trim()) return;
    const doctor = doctors.find((d) => d.id === doctorId);
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
      setError(err instanceof ApiError ? err.message : "Could not book that slot. Try another.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status !== "authenticated") return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold text-ink-900">Book an appointment</h1>
        <p className="mt-1 text-sm text-ink-500">Pick a department, a doctor, and an open time.</p>

        <Card className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Department"
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value ? Number(e.target.value) : "");
                setDoctorId("");
              }}
            >
              <option value="">Any department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Doctor"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Choose a doctor</option>
              {filteredDoctors.map((d) => (
                <option key={d.id} value={d.id} disabled={!d.isAcceptingNew}>
                  Dr. {d.user.name} — {d.specialization}
                  {!d.isAcceptingNew ? " (not accepting new patients)" : ""}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-ink-700" htmlFor="day">
              Day
            </label>
            <input
              id="day"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-rule-strong bg-white px-3 text-sm text-ink-900 focus-visible:border-accent-600 sm:w-56"
            />
          </div>

          {doctorId && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-ink-700">Available times</p>
              {slotsLoading ? (
                <LoadingRows rows={1} />
              ) : !slots || slots.length === 0 ? (
                <EmptyState
                  title="No hours configured for that day"
                  body="Try a different day, or a different doctor."
                />
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => {
                    const label = new Date(s.start).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    });
                    const selected = selectedSlot === s.start;
                    return (
                      <button
                        key={s.start}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setSelectedSlot(s.start)}
                        className={`rounded-md border px-2 py-2 text-sm font-medium transition-colors ${
                          selected
                            ? "border-accent-700 bg-accent-700 text-white"
                            : s.available
                              ? "border-rule-strong bg-white text-ink-900 hover:border-accent-600"
                              : "cursor-not-allowed border-rule bg-paper text-ink-300 line-through"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedSlot && (
            <div className="mt-5">
              <TextAreaField
                label="Reason for visit"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe the reason for your visit"
              />
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-md bg-[var(--color-signal-stop-bg)] px-3 py-2 text-sm text-[var(--color-signal-stop)]">
              {error}
            </p>
          )}

          <Button
            className="mt-5 w-full"
            disabled={!selectedSlot || !reason.trim()}
            loading={submitting}
            onClick={handleBook}
          >
            Request appointment
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
