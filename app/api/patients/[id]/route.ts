import { prisma } from "@/lib/prisma";
import { ok, parseBody, parseId, route, HttpError } from "@/lib/api";
import { assertCanAccessPatient, requireRole, requireSession } from "@/lib/auth";
import { patientProfileSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { Role } from "@prisma/client";

// Next.js 15 delivers dynamic route params as a Promise.
type Ctx = { params: Promise<{ id: string }> };

const DETAIL_SELECT = {
  id: true,
  mrn: true,
  dateOfBirth: true,
  bloodType: true,
  allergies: true,
  history: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  emergencyContactRelation: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      age: true,
      gender: true,
    },
  },
};

/// The original handler queried `prisma.user` with a string id against an Int
/// column, had no authentication at all, and returned any record by id — a
/// textbook insecure direct object reference on medical data.
export const GET = route(async (_req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const id = parseId((await ctx.params).id, "patient id");

  await assertCanAccessPatient(session, id);

  const patient = await prisma.patient.findUnique({
    where: { id },
    select: DETAIL_SELECT,
  });
  if (!patient) throw new HttpError(404, "Patient not found");

  await recordAudit({
    actorId: session.user.id,
    action: "patient.viewed",
    entity: "Patient",
    entityId: id,
  });

  return ok(patient);
});

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const session = await requireRole(Role.ADMIN, Role.STAFF, Role.DOCTOR);
  const id = parseId((await ctx.params).id, "patient id");

  await assertCanAccessPatient(session, id);
  const input = await parseBody(req, patientProfileSchema);

  const patient = await prisma.patient.update({
    where: { id },
    data: {
      dateOfBirth: input.dateOfBirth ?? undefined,
      bloodType: input.bloodType ?? undefined,
      allergies: input.allergies ?? undefined,
      history: input.history ?? undefined,
      emergencyContactName: input.emergencyContactName ?? undefined,
      emergencyContactPhone: input.emergencyContactPhone ?? undefined,
      emergencyContactRelation: input.emergencyContactRelation ?? undefined,
    },
    select: DETAIL_SELECT,
  });

  await recordAudit({
    actorId: session.user.id,
    action: "patient.updated",
    entity: "Patient",
    entityId: id,
  });

  return ok(patient);
});
