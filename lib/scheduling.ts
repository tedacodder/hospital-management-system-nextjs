import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/api";

// Bookable slots are derived at request time from a doctor's weekly
// availability windows minus their existing appointments. Nothing is
// materialised, so changing a window takes effect immediately.

const LIVE_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
];

export function minutesSinceMidnight(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function overlaps(aStart: Date, aMins: number, bStart: Date, bMins: number): boolean {
  const aEnd = aStart.getTime() + aMins * 60_000;
  const bEnd = bStart.getTime() + bMins * 60_000;
  return aStart.getTime() < bEnd && bStart.getTime() < aEnd;
}

/// Throws unless `start` falls inside one of the doctor's active windows and
/// collides with no live appointment. `ignoreAppointmentId` lets a reschedule
/// skip the row being moved.
export async function assertSlotIsBookable(
  doctorId: number,
  start: Date,
  durationMinutes: number,
  ignoreAppointmentId?: number,
): Promise<void> {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true, isAcceptingNew: true },
  });
  if (!doctor) throw new HttpError(404, "Doctor not found");

  const windows = await prisma.doctorAvailability.findMany({
    where: { doctorId, dayOfWeek: start.getDay(), isActive: true },
    select: { startTime: true, endTime: true },
  });

  // A doctor with no configured hours is treated as open — otherwise upgrading
  // an existing deployment would block every booking until hours are entered.
  if (windows.length > 0) {
    const startMins = start.getHours() * 60 + start.getMinutes();
    const endMins = startMins + durationMinutes;

    const inWindow = windows.some(
      (w) =>
        startMins >= minutesSinceMidnight(w.startTime) &&
        endMins <= minutesSinceMidnight(w.endTime),
    );
    if (!inWindow) {
      throw new HttpError(409, "That time is outside the doctor's working hours");
    }
  }

  // Only appointments on the same calendar day can collide.
  const dayStart = new Date(start);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const sameDay = await prisma.appointment.findMany({
    where: {
      doctorId,
      status: { in: LIVE_STATUSES },
      date: { gte: dayStart, lt: dayEnd },
      ...(ignoreAppointmentId ? { NOT: { id: ignoreAppointmentId } } : {}),
    },
    select: { date: true, durationMinutes: true },
  });

  const clash = sameDay.some((a) =>
    overlaps(start, durationMinutes, a.date, a.durationMinutes),
  );
  if (clash) {
    throw new HttpError(409, "The doctor already has an appointment at that time");
  }
}

export type Slot = { start: string; available: boolean };

/// Every slot on a given day, with taken ones flagged. Drives the booking UI so
/// unavailable times are visible rather than silently rejected on submit.
export async function slotsForDay(doctorId: number, day: Date): Promise<Slot[]> {
  const windows = await prisma.doctorAvailability.findMany({
    where: { doctorId, dayOfWeek: day.getDay(), isActive: true },
    orderBy: { startTime: "asc" },
  });
  if (windows.length === 0) return [];

  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const booked = await prisma.appointment.findMany({
    where: {
      doctorId,
      status: { in: LIVE_STATUSES },
      date: { gte: dayStart, lt: dayEnd },
    },
    select: { date: true, durationMinutes: true },
  });

  const slots: Slot[] = [];
  const now = Date.now();

  for (const w of windows) {
    const from = minutesSinceMidnight(w.startTime);
    const to = minutesSinceMidnight(w.endTime);

    for (let m = from; m + w.slotMinutes <= to; m += w.slotMinutes) {
      const start = new Date(dayStart);
      start.setMinutes(m);

      const taken = booked.some((b) =>
        overlaps(start, w.slotMinutes, b.date, b.durationMinutes),
      );

      slots.push({
        start: start.toISOString(),
        available: !taken && start.getTime() > now,
      });
    }
  }

  return slots;
}
