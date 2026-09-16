import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildMeta, created, ok, parseBody, parseQuery, route } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { adminCreateUserSchema, paginationSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

const SAFE_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  address: true,
  age: true,
  gender: true,
  isActive: true,
  createdAt: true,
  lastLoginAt: true,
} satisfies Prisma.UserSelect;

/// Admin-only directory listing. Previously this returned every user, including
/// password hashes, to anonymous callers.
export const GET = route(async (req: Request) => {
  await requireRole(Role.ADMIN);

  const { page, pageSize, q } = parseQuery(req, paginationSchema);

  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: SAFE_FIELDS,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return ok(users, { meta: buildMeta(page, pageSize, total) });
});

/// Admin-only account creation. This is the only endpoint permitted to assign a
/// role other than PATIENT.
export const POST = route(async (req: Request) => {
  const session = await requireRole(Role.ADMIN);
  const input = await parseBody(req, adminCreateUserSchema);

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: passwordHash,
        role: input.role,
        phone: input.phone ?? "",
        address: input.address ?? "",
        age: input.age ?? "",
        gender: input.gender ?? "",
      },
      select: SAFE_FIELDS,
    });

    if (input.role === Role.PATIENT) {
      const p = await tx.patient.create({ data: { userId: u.id }, select: { id: true } });
      await tx.patient.update({
        where: { id: p.id },
        data: { mrn: `P-${String(p.id).padStart(6, "0")}` },
      });
    }

    if (input.role === Role.DOCTOR) {
      await tx.doctor.create({
        data: {
          userId: u.id,
          specialization: input.specialization ?? "General Practice",
          departmentId: input.departmentId ?? null,
        },
      });
    }

    return u;
  });

  await recordAudit({
    actorId: session.user.id,
    action: "user.created",
    entity: "User",
    entityId: user.id,
    summary: `role=${input.role}`,
  });

  return created(user);
});
