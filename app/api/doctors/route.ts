import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildMeta, ok, parseQuery, route } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { paginationSchema } from "@/lib/validation";

// Doctor creation lives in POST /api/users (admin-only) so that account
// provisioning has exactly one code path. The previous POST here wrote
// `full_name`, `password_hash`, `user_id` and `role: "doctor"` — none of which
// exist on the User model — and would have thrown on every call.

const SELECT = {
  id: true,
  specialization: true,
  bio: true,
  yearsExperience: true,
  consultationFee: true,
  isAcceptingNew: true,
  department: { select: { id: true, name: true } },
  user: { select: { id: true, name: true, email: true, phone: true } },
  _count: { select: { appointments: true } },
} satisfies Prisma.DoctorSelect;

/// Directory of doctors. Readable by any signed-in user because patients need it
/// to choose who to book with; contact details are limited to work email/phone.
export const GET = route(async (req: Request) => {
  await requireSession();
  const { page, pageSize, q } = parseQuery(req, paginationSchema);

  const where: Prisma.DoctorWhereInput = q
    ? {
        OR: [
          { specialization: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } },
          { department: { name: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      select: SELECT,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.doctor.count({ where }),
  ]);

  return ok(doctors, { meta: buildMeta(page, pageSize, total) });
});
