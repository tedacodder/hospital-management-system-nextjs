import { AppointmentStatus, NotificationType, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, parseBody, parseId, route, HttpError } from "@/lib/api";
import { isStaff, requireSession, type AuthedSession } from "@/lib/auth";
import { updateAppointmentSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { assertSlotIsBookable } from "@/lib/scheduling";

type Ctx = { params: Promise<{ id: string }> };

const INCLUDE = {
  patient: { select: { id: true, mrn: true, user: { select: { id: true, name: true } } } },
  doctor: { select: { id: true, user: { select: { id: true, name: true } } } },
} satisfies Prisma.AppointmentInclude;

async function loadAndAuthorize(session: AuthedSession, id: number) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: INCLUDE,
  });
  if (!appointment) throw new HttpError(404, "Appointment not found");

  if (isStaff(session.user.role)) return appointment;

  if (session.user.role === Role.DOCTOR) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (appointment.doctorId !== doctor?.id) throw new HttpError(403, "Forbidden");
    return appointment;
  }

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (appointment.patientId !== patient?.id) throw new HttpError(403, "Forbidden");
  return appointment;
}

export const GET = route(async (_req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const id = parseId((await ctx.params).id, "appointment id");
  return ok(await loadAndAuthorize(session, id));
});

/// Reschedule, reassign, or change status.
///
/// Patients may only cancel their own appointment; everything else — assigning a
/// doctor, confirming, marking complete — is staff or the treating doctor.
export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const id = parseId((await ctx.params).id, "appointment id");
  const current = await loadAndAuthorize(session, id);
  const input = await parseBody(req, updateAppointmentSchema);

  const isPatient = session.user.role === Role.PATIENT;
  if (isPatient) {
    const onlyCancelling =
      input.status === AppointmentStatus.CANCELLED &&
      input.doctorId === undefined &&
      input.date === undefined &&
      input.department === undefined;
    if (!onlyCancelling) {
      throw new HttpError(403, "You can only cancel this appointment");
    }
  }

  if (
    current.status === AppointmentStatus.COMPLETED &&
    input.status !== AppointmentStatus.COMPLETED
  ) {
    throw new HttpError(409, "A completed appointment cannot be reopened");
  }

  const nextDoctorId = input.doctorId === undefined ? current.doctorId : input.doctorId;
  const nextDate = input.date ?? current.date;
  const nextDuration = input.durationMinutes ?? current.durationMinutes;

  const movingSlot =
    (input.date !== undefined || input.doctorId !== undefined) &&
    nextDoctorId != null &&
    input.status !== AppointmentStatus.CANCELLED;

  if (movingSlot) {
    await assertSlotIsBookable(nextDoctorId, nextDate, nextDuration, id);
  }

  const cancelling = input.status === AppointmentStatus.CANCELLED;

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      doctorId: input.doctorId === undefined ? undefined : input.doctorId,
      department: input.department,
      date: input.date,
      durationMinutes: input.durationMinutes,
      reason: input.reason,
      notes: input.notes,
      status: input.status,
      cancelledAt: cancelling ? new Date() : undefined,
      cancelReason: cancelling ? input.cancelReason ?? null : undefined,
    },
    include: INCLUDE,
  });

  await recordAudit({
    actorId: session.user.id,
    action: cancelling ? "appointment.cancelled" : "appointment.updated",
    entity: "Appointment",
    entityId: id,
    summary: input.status ? `status=${input.status}` : undefined,
  });

  // Tell the other party something changed.
  const recipientId = isPatient
    ? appointment.doctor?.user.id
    : appointment.patient.user.id;
  if (recipientId) {
    await notify({
      userId: recipientId,
      type: NotificationType.APPOINTMENT,
      title: cancelling ? "Appointment cancelled" : "Appointment updated",
      body: `Appointment on ${appointment.date.toLocaleString()} was ${cancelling ? "cancelled" : "updated"}.`,
      link: isPatient ? "/dashboard/doc" : "/dashboard/user",
    });
  }

  return ok(appointment);
});
