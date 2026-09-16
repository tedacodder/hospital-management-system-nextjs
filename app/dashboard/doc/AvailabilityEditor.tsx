"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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

type DraftDay = { enabled: boolean; startTime: string; endTime: string; slotMinutes: number };

const emptyDraft = (): DraftDay => ({ enabled: false, startTime: "09:00", endTime: "17:00", slotMinutes: 30 });

/// One row per weekday. A day with no window is "closed"; toggling it on
/// creates a single window for that day. This intentionally doesn't support
/// multiple windows per day (e.g. a lunch break) — that's a real limitation,
/// not an oversight, and is noted in the README.
export function AvailabilityEditor({ doctorId }: { doctorId: number }) {
  const { push } = useToast();
  const [drafts, setDrafts] = useState<DraftDay[]>(() => DAYS.map(() => emptyDraft()));
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
      setLoading(false);
    });
  }, [doctorId]);

  async function saveDay(dayOfWeek: number) {
    const d = drafts[dayOfWeek];
    if (d.startTime >= d.endTime) {
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
      push(`${DAYS[dayOfWeek]} hours saved.`);
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't save that day.", "error");
    } finally {
      setSavingDay(null);
    }
  }

  if (loading) return <div className="h-40 animate-pulse rounded-lg bg-ink-900/5" />;

  return (
    <Card>
      <p className="mb-4 text-sm text-ink-500">
        Set the hours you see patients each week. Appointments can only be booked inside these windows.
      </p>
      <div className="flex flex-col divide-y divide-rule">
        {DAYS.map((label, i) => {
          const d = drafts[i];
          return (
            <div key={label} className="flex flex-wrap items-center gap-3 py-3">
              <label className="flex w-32 items-center gap-2 text-sm font-medium text-ink-900">
                <input
                  type="checkbox"
                  checked={d.enabled}
                  onChange={(e) => {
                    const next = [...drafts];
                    next[i] = { ...d, enabled: e.target.checked };
                    setDrafts(next);
                  }}
                />
                {label}
              </label>

              {d.enabled && (
                <>
                  <input
                    type="time"
                    value={d.startTime}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[i] = { ...d, startTime: e.target.value };
                      setDrafts(next);
                    }}
                    className="h-9 rounded-md border border-rule-strong px-2 text-sm"
                  />
                  <span className="text-sm text-ink-500">to</span>
                  <input
                    type="time"
                    value={d.endTime}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[i] = { ...d, endTime: e.target.value };
                      setDrafts(next);
                    }}
                    className="h-9 rounded-md border border-rule-strong px-2 text-sm"
                  />
                  <select
                    value={d.slotMinutes}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[i] = { ...d, slotMinutes: Number(e.target.value) };
                      setDrafts(next);
                    }}
                    className="h-9 rounded-md border border-rule-strong px-2 text-sm"
                  >
                    <option value={15}>15 min slots</option>
                    <option value={20}>20 min slots</option>
                    <option value={30}>30 min slots</option>
                    <option value={45}>45 min slots</option>
                    <option value={60}>60 min slots</option>
                  </select>
                </>
              )}

              <Button size="sm" variant="secondary" loading={savingDay === i} onClick={() => saveDay(i)} className="ml-auto">
                Save
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
