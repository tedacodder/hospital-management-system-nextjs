import { prisma } from "@/lib/prisma";
import { ok, parseId, route, HttpError } from "@/lib/api";
import { requireSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

/// Marks one notification read. Scoped by userId so a caller cannot mutate
/// somebody else's notification by guessing an id.
export const PATCH = route(async (_req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const id = parseId((await ctx.params).id, "notification id");

  const result = await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true, readAt: new Date() },
  });

  if (result.count === 0) throw new HttpError(404, "Notification not found");
  return ok({ id, isRead: true });
});
