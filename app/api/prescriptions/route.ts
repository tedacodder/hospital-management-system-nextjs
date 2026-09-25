import { NotificationType, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildMeta, created, ok, parseBody, parseQuery, route, HttpError } from "@/lib/api";
import { assertCanAccessPatient, isStaff, requireOwnDoctor, requireSession } from "@/lib/auth";
import { createPrescriptionSchema, prescriptionQuerySchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";

const INCLUDE = {
  items: true,
  patient: { select: { id: true, mrn: true, user: { select: { id: true, name: true } } } },
  doctor: { select: { id: true, specialization: true, user: { select: { name: true } } } },
} satisfies Prisma.PrescriptionInclude;

export const GET = route(async (req: Request) => {
  const session = await requireSession();
  const { page, pageSize, patientId } = parseQuery(req, prescriptionQuerySchema);

  let where: Prisma.PrescriptionWhereInput = {};
  if (session.user.role === Role.PATIENT) {
    const own = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    where = { patientId: own?.id ?? -1 };
  } else if (session.user.role === Role.DOCTOR) {
    const doctor = await requireOwnDoctor(session);
    where = { doctorId: doctor.id };
  }

  // A patientId filter may only narrow an already-scoped query (a doctor's
  // own prescriptions, filtered to one patient's chart) or, for staff, scope
  // an otherwise-unscoped query to one patient.
  if (patientId && (isStaff(session.user.role) || session.user.role === Role.DOCTOR)) {
    where = { ...where, patientId };
  }

  const [prescriptions, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      include: INCLUDE,
      orderBy: { issuedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.prescription.count({ where }),
  ]);

  return ok(prescriptions, { meta: buildMeta(page, pageSize, total) });
});

/// Prescribing is a clinical act: doctors only, and only for their own patients.
export const POST = route(async (req: Request) => {
  const session = await requireSession();
  if (session.user.role !== Role.DOCTOR) {
    throw new HttpError(403, "Only a doctor can issue a prescription");
  }

  const doctor = await requireOwnDoctor(session);
  const input = await parseBody(req, createPrescriptionSchema);
  await assertCanAccessPatient(session, input.patientId);

  const prescription = await prisma.prescription.create({
    data: {
      patientId: input.patientId,
      doctorId: doctor.id,
      medicalRecordId: input.medicalRecordId ?? null,
      appointmentId: input.appointmentId ?? null,
      notes: input.notes || null,
      items: { create: input.items.map((i) => ({ ...i, instructions: i.instructions || null })) },
    },
    include: INCLUDE,
  });

  await recordAudit({
    actorId: session.user.id,
    action: "prescription.created",
    entity: "Prescription",
    entityId: prescription.id,
  });

  await notify({
    userId: prescription.patient.user.id,
    type: NotificationType.PRESCRIPTION,
    title: "New prescription issued",
    body: `${prescription.items.length} medication(s) were prescribed for you.`,
    link: "/dashboard/user",
  });

  return created(prescription);
});
