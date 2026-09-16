import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { created, ok, parseBody, route } from "@/lib/api";
import { requireRole, requireSession } from "@/lib/auth";
import { departmentSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

// This file was previously named `routes.ts`, so Next.js never registered it
// and the endpoint did not exist.

/// Any signed-in user may read the department list — it drives the booking form.
export const GET = route(async () => {
  await requireSession();

  const departments = await prisma.department.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      _count: { select: { doctors: true } },
    },
  });

  return ok(departments);
});

export const POST = route(async (req: Request) => {
  const session = await requireRole(Role.ADMIN);
  const input = await parseBody(req, departmentSchema);

  const department = await prisma.department.create({
    data: {
      name: input.name,
      description: input.description || null,
      isActive: input.isActive ?? true,
    },
  });

  await recordAudit({
    actorId: session.user.id,
    action: "department.created",
    entity: "Department",
    entityId: department.id,
  });

  return created(department);
});
