import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { created, ok, parseBody, parseId, route, HttpError } from "@/lib/api";
import { isStaff, requireSession } from "@/lib/auth";
import { availabilitySchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  await requireSession();
  const doctorId = parseId((await ctx.params).id, "doctor id");

  const windows = await prisma.doctorAvailability.findMany({
    where: { doctorId, isActive: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return ok(windows);
});

/// A doctor manages their own hours; admins may manage anyone's.
export const POST = route(async (req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const doctorId = parseId((await ctx.params).id, "doctor id");

  if (!isStaff(session.user.role)) {
    const own = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (own?.id !== doctorId) throw new HttpError(403, "Forbidden");
  }

  const input = await parseBody(req, availabilitySchema);

  const window = await prisma.doctorAvailability.upsert({
    where: {
      doctorId_dayOfWeek_startTime: {
        doctorId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
      },
    },
    create: { doctorId, ...input },
    update: {
      endTime: input.endTime,
      slotMinutes: input.slotMinutes,
      isActive: input.isActive,
    },
  });

  await recordAudit({
    actorId: session.user.id,
    action: "availability.set",
    entity: "Doctor",
    entityId: doctorId,
  });

  return created(window);
});
