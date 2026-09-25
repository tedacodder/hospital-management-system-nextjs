"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ClockIcon } from "@/components/ui/Icons";
import { useToast } from "@/components/ui/Toast";
import { apiGet, apiSend, ApiError } from "@/lib/api-client";

type Window = {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  isActive: boolean;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DraftDay = { enabled: boolean; startTime: string; endTime: string; slotMinutes: number };

const emptyDraft = (): DraftDay => ({ enabled: false, startTime: "09:00", endTime: "17:00", slotMinutes: 30 });

function sameDraft(a: DraftDay, b: DraftDay): boolean {
  return (
    a.enabled === b.enabled &&
    (!a.enabled || (a.startTime === b.startTime && a.endTime === b.endTime && a.slotMinutes === b.slotMinutes))
  );
}

/// Hours between two HH:mm strings, for the "X hrs/week" summary.
function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

/// One row per weekday. A day with no window is "closed"; toggling it on
/// creates a single window for that day. This intentionally doesn't support
/// multiple windows per day (e.g. a lunch break) — that's a real limitation,
/// not an oversight, and is noted below the schedule.
export function AvailabilityEditor({ doctorId }: { doctorId: number }) {
  const { push } = useToast();
  const [drafts, setDrafts] = useState<DraftDay[]>(() => DAYS.map(() => emptyDraft()));
  const [saved, setSaved] = useState<DraftDay[]>(() => DAYS.map(() => emptyDraft()));
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState<number | null>(null);

  useEffect(() => {
    apiGet<Window[]>(`/doctors/${doctorId}/availability`).then((windows) => {
      const next = DAYS.map(() => emptyDraft());
      for (const w of windows) {
        next[w.dayOfWeek] = {
          enabled: w.isActive,
          startTime: w.startTime,
          endTime: w.endTime,
          slotMinutes: w.slotMinutes,
        };
      }
      setDrafts(next);
      setSaved(next);
      setLoading(false);
    });
  }, [doctorId]);

  function updateDay(i: number, patch: Partial<DraftDay>) {
    const next = [...drafts];
    next[i] = { ...next[i], ...patch };
    setDrafts(next);
  }

  async function saveDay(dayOfWeek: number) {
    const d = drafts[dayOfWeek];
    if (d.enabled && d.startTime >= d.endTime) {
      push("End time must be after start time.", "error");
      return;
    }
    setSavingDay(dayOfWeek);
    try {
      await apiSend("POST", `/doctors/${doctorId}/availability`, {
        dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
        slotMinutes: d.slotMinutes,
        isActive: d.enabled,
      });
      setSaved((prev) => {
        const next = [...prev];
        next[dayOfWeek] = d;
        return next;
      });
      push(`${DAYS[dayOfWeek]} hours saved.`);
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't save that day.", "error");
    } finally {
      setSavingDay(null);
    }
  }

  /// Copies Monday's hours onto Tue-Fri, so a typical weekday schedule takes
  /// one edit instead of five. Nothing is saved until each day is confirmed.
  function copyMondayToWeekdays() {
    const monday = drafts[1];
    if (!monday.enabled) {
      push("Set Monday's hours first, then copy them to the rest of the week.", "error");
      return;
    }
    const next = [...drafts];
    for (const day of [2, 3, 4, 5]) next[day] = { ...monday };
    setDrafts(next);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2.5" role="status" aria-label="Loading availability" aria-busy="true">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-16" />
        ))}
      </div>
    );
  }

  const openDays = drafts.filter((d) => d.enabled).length;
  const weeklyHours = drafts.reduce((sum, d) => (d.enabled ? sum + hoursBetween(d.startTime, d.endTime) : sum), 0);

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent-050 text-accent-700">
            <ClockIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">
              {openDays === 0
                ? "No hours set"
                : `${openDays} ${openDays === 1 ? "day" : "days"} open · ${weeklyHours % 1 === 0 ? weeklyHours : weeklyHours.toFixed(1)} hrs/week`}
            </p>
            <p className="text-xs text-ink-500">Appointments can only be booked inside the windows you set below.</p>
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={copyMondayToWeekdays}>
          Copy Monday to Tue–Fri
        </Button>
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-col divide-y divide-rule">
          {DAYS.map((label, i) => {
            const d = drafts[i];
            const dirty = !sameDraft(d, saved[i]);
            return (
              <div key={label} className="flex flex-wrap items-center gap-3 p-4">
                <label className="flex w-32 shrink-0 items-center gap-2.5 text-sm font-medium text-ink-900">
                  <input
                    type="checkbox"
                    checked={d.enabled}
                    onChange={(e) => updateDay(i, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-rule-strong text-accent-700 focus-visible:outline-accent-600"
                  />
                  <span>
                    {label}
                    <span className="hidden text-ink-500 sm:inline"> ({SHORT_DAYS[i]})</span>
                  </span>
                </label>

                {d.enabled ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="time"
                      value={d.startTime}
                      onChange={(e) => updateDay(i, { startTime: e.target.value })}
                      aria-label={`${label} start time`}
                      className="h-9 rounded-md border border-rule-strong px-2 text-sm text-ink-900"
                    />
                    <span className="text-sm text-ink-500">to</span>
                    <input
                      type="time"
                      value={d.endTime}
                      onChange={(e) => updateDay(i, { endTime: e.target.value })}
                      aria-label={`${label} end time`}
                      className="h-9 rounded-md border border-rule-strong px-2 text-sm text-ink-900"
                    />
                    <select
                      value={d.slotMinutes}
                      onChange={(e) => updateDay(i, { slotMinutes: Number(e.target.value) })}
                      aria-label={`${label} slot length`}
                      className="h-9 rounded-md border border-rule-strong px-2 text-sm text-ink-900"
                    >
                      <option value={15}>15 min slots</option>
                      <option value={20}>20 min slots</option>
                      <option value={30}>30 min slots</option>
                      <option value={45}>45 min slots</option>
                      <option value={60}>60 min slots</option>
                    </select>
                  </div>
                ) : (
                  <span className="text-sm text-ink-500">Closed</span>
                )}

                <Button
                  size="sm"
                  variant="secondary"
                  loading={savingDay === i}
                  disabled={!dirty}
                  onClick={() => saveDay(i)}
                  className="ml-auto"
                >
                  {dirty ? "Save" : "Saved"}
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="text-xs text-ink-500">Each day supports one continuous window. For a midday break, book the second half separately.</p>
    </div>
  );
}
