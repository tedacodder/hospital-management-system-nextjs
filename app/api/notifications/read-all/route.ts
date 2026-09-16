import { prisma } from "@/lib/prisma";
import { ok, route } from "@/lib/api";
import { requireSession } from "@/lib/auth";

export const POST = route(async () => {
  const session = await requireSession();

  const result = await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return ok({ marked: result.count });
});
