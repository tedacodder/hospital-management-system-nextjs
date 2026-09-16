import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildMeta, created, ok, parseBody, parseQuery, route, HttpError } from "@/lib/api";
import {
  assertCanAccessPatient,
  isStaff,
  requireOwnDoctor,
  requireSession,
} from "@/lib/auth";
import { createRecordSchema, paginationSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

// The previous handler wrote `patient_id`, `doctor_id`, `diagnosis` and
// `treatment` to a model whose only fields were `details` and `patientId`, and
// included a `doctor` relation that did not exist. Both now exist on the schema.

const INCLUDE = {
  patient: { select: { id: true, mrn: true, user: { select: { name: true } } } },
  doctor: { select: { id: true, specialization: true, user: { select: { name: true } } } },
  prescriptions: { select: { id: true, issuedAt: true, status: true } },
} satisfies Prisma.MedicalRecordInclude;

const querySchema = paginationSchema.extend({
  patientId: paginationSchema.shape.page.optional(),
});

/// Chronological chart. Patients see their own; doctors see charts for patients
/// they treat; staff see all.
export const GET = route(async (req: Request) => {
  const session = await requireSession();
  const { page, pageSize, patientId } = parseQuery(req, querySchema);

  let where: Prisma.MedicalRecordWhereInput;

  if (session.user.role === Role.PATIENT) {
    const own = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    where = { patientId: own?.id ?? -1 };
  } else if (patientId) {
    await assertCanAccessPatient(session, patientId);
    where = { patientId };
  } else if (session.user.role === Role.DOCTOR) {
    const doctor = await requireOwnDoctor(session);
    where = { doctorId: doctor.id };
  } else {
    where = {};
  }

  const [records, total] = await Promise.all([
    prisma.medicalRecord.findMany({
      where,
      include: INCLUDE,
      orderBy: { visitDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.medicalRecord.count({ where }),
  ]);

  return ok(records, { meta: buildMeta(page, pageSize, total) });
});

/// Only a doctor writes to a chart. Staff and patients cannot.
export const POST = route(async (req: Request) => {
  const session = await requireSession();
  if (session.user.role !== Role.DOCTOR) {
    throw new HttpError(403, "Only a doctor can add to a medical record");
  }

  const doctor = await requireOwnDoctor(session);
  const input = await parseBody(req, createRecordSchema);
  await assertCanAccessPatient(session, input.patientId);

  const record = await prisma.medicalRecord.create({
    data: {
      patientId: input.patientId,
      doctorId: doctor.id,
      appointmentId: input.appointmentId ?? null,
      visitDate: input.visitDate ?? new Date(),
      details: input.details,
      diagnosis: input.diagnosis || null,
      symptoms: input.symptoms || null,
      treatment: input.treatment || null,
      notes: input.notes || null,
    },
    include: INCLUDE,
  });

  await recordAudit({
    actorId: session.user.id,
    action: "record.created",
    entity: "MedicalRecord",
    entityId: record.id,
  });

  return created(record);
});
