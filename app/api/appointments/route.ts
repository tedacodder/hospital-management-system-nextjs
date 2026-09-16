import { AppointmentStatus, NotificationType, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildMeta, created, ok, parseBody, parseQuery, route, HttpError } from "@/lib/api";
import {
  isStaff,
  requireOwnPatient,
  requireSession,
  type AuthedSession,
} from "@/lib/auth";
import { appointmentQuerySchema, createAppointmentSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { assertSlotIsBookable } from "@/lib/scheduling";

const INCLUDE = {
  patient: { select: { id: true, mrn: true, user: { select: { id: true, name: true, email: true, phone: true } } } },
  doctor: { select: { id: true, specialization: true, user: { select: { id: true, name: true } } } },
} satisfies Prisma.AppointmentInclude;

/// Scopes a query to what the caller is allowed to see. Patients see only their
/// own appointments; doctors see only their own schedule; staff see everything.
async function scopeFor(session: AuthedSession): Promise<Prisma.AppointmentWhereInput> {
  if (isStaff(session.user.role)) return {};

  if (session.user.role === Role.DOCTOR) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    return { doctorId: doctor?.id ?? -1 };
  }

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return { patientId: patient?.id ?? -1 };
}

/// The previous handler took an `email` query parameter and returned that
/// person's appointments to anyone who asked — or the entire appointment table
/// when the parameter was omitted. Scope is now derived from the session.
export const GET = route(async (req: Request) => {
  const session = await requireSession();
  const { page, pageSize, status, doctorId, patientId, from, to, order } =
    parseQuery(req, appointmentQuerySchema);

  const scope = await scopeFor(session);
  const where: Prisma.AppointmentWhereInput = {
    ...scope,
    ...(status ? { status } : {}),
    // Explicit filters may only narrow the scope, never widen it.
    ...(doctorId && isStaff(session.user.role) ? { doctorId } : {}),
    ...(patientId && isStaff(session.user.role) ? { patientId } : {}),
    ...(from || to
      ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
  };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: INCLUDE,
      orderBy: { date: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.appointment.count({ where }),
  ]);

  return ok(appointments, { meta: buildMeta(page, pageSize, total) });
});

/// Books an appointment.
///
/// The previous handler accepted a name and email from an unauthenticated
/// request and silently created a User with the plaintext password
/// "default_password" — an open account-creation endpoint. Booking now requires
/// a session and an existing patient record.
export const POST = route(async (req: Request) => {
  const session = await requireSession();
  const input = await parseBody(req, createAppointmentSchema);

  let patientId: number;
  if (isStaff(session.user.role)) {
    if (!input.patientId) throw new HttpError(400, "Select a patient");
    patientId = input.patientId;
  } else if (session.user.role === Role.PATIENT) {
    const own = await requireOwnPatient(session);
    patientId = own.id;
  } else {
    throw new HttpError(403, "Doctors cannot book appointments for themselves");
  }

  if (input.doctorId) {
    await assertSlotIsBookable(input.doctorId, input.date, input.durationMinutes);
  }

  let appointment;
  try {
    appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: input.doctorId ?? null,
        department: input.department,
        date: input.date,
        durationMinutes: input.durationMinutes,
        reason: input.reason,
        notes: input.notes || null,
        status: AppointmentStatus.PENDING,
      },
      include: INCLUDE,
    });
  } catch (err) {
    // The (doctorId, date) unique index is the last line of defence against two
    // concurrent requests passing the availability check simultaneously.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new HttpError(409, "That time slot was just taken. Pick another.");
    }
    throw err;
  }

  await recordAudit({
    actorId: session.user.id,
    action: "appointment.created",
    entity: "Appointment",
    entityId: appointment.id,
  });

  if (appointment.doctor?.user.id) {
    await notify({
      userId: appointment.doctor.user.id,
      type: NotificationType.APPOINTMENT,
      title: "New appointment request",
      body: `${appointment.patient.user.name ?? "A patient"} requested ${appointment.date.toLocaleString()}.`,
      link: `/dashboard/doc`,
    });
  }

  return created(appointment);
});
