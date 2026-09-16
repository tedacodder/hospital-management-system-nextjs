import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildMeta, created, ok, parseBody, parseQuery, route, HttpError } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { createPatientSchema, paginationSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

const LIST_SELECT = {
  id: true,
  mrn: true,
  dateOfBirth: true,
  bloodType: true,
  createdAt: true,
  user: {
    select: { id: true, name: true, email: true, phone: true, gender: true, age: true },
  },
  _count: { select: { appointments: true } },
} satisfies Prisma.PatientSelect;

/// Staff-side patient directory with search and pagination.
/// Previously this returned every patient to anonymous callers.
export const GET = route(async (req: Request) => {
  await requireRole(Role.ADMIN, Role.STAFF, Role.DOCTOR);

  const { page, pageSize, q } = parseQuery(req, paginationSchema);

  const where: Prisma.PatientWhereInput = q
    ? {
        OR: [
          { mrn: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
          { user: { phone: { contains: q } } },
        ],
      }
    : {};

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      select: LIST_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.patient.count({ where }),
  ]);

  return ok(patients, { meta: buildMeta(page, pageSize, total) });
});

/// Registers a patient at the front desk.
///
/// When no password is supplied a random one is generated and hashed. The
/// previous implementation stored the literal string "default123" in plaintext,
/// which both leaked credentials and produced accounts that could never sign in
/// (NextAuth compares against a bcrypt hash).
export const POST = route(async (req: Request) => {
  const session = await requireRole(Role.ADMIN, Role.STAFF);
  const input = await parseBody(req, createPatientSchema);

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) throw new HttpError(409, "An account with that email already exists");

  const rawPassword = input.password ?? crypto.randomUUID();
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  const patient = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: passwordHash,
        role: Role.PATIENT,
        phone: input.phone ?? "",
        address: input.address ?? "",
        age: input.age ?? "",
        gender: input.gender ?? "",
      },
      select: { id: true },
    });

    const p = await tx.patient.create({
      data: {
        userId: user.id,
        dateOfBirth: input.dateOfBirth ?? null,
        bloodType: input.bloodType ?? null,
        allergies: input.allergies || null,
        history: input.history || null,
        emergencyContactName: input.emergencyContactName || null,
        emergencyContactPhone: input.emergencyContactPhone || null,
        emergencyContactRelation: input.emergencyContactRelation || null,
      },
      select: { id: true },
    });

    return tx.patient.update({
      where: { id: p.id },
      data: { mrn: `P-${String(p.id).padStart(6, "0")}` },
      select: LIST_SELECT,
    });
  });

  await recordAudit({
    actorId: session.user.id,
    action: "patient.created",
    entity: "Patient",
    entityId: patient.id,
  });

  // The generated password is returned once, only to the staff member who
  // created the account, so it can be handed to the patient. It is never stored
  // in readable form.
  return created({
    patient,
    temporaryPassword: input.password ? undefined : rawPassword,
  });
});
