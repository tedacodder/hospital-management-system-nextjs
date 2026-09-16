import { prisma } from "@/lib/prisma";
import { buildMeta, ok, parseQuery, route } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { paginationSchema } from "@/lib/validation";

// The previous handler returned every notification for every user to anonymous
// callers, and referenced a model that did not exist.

/// The signed-in user's own notifications, plus an unread count for the badge.
export const GET = route(async (req: Request) => {
  const session = await requireSession();
  const { page, pageSize } = parseQuery(req, paginationSchema);
  const where = { userId: session.user.id };

  const [notifications, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, isRead: false } }),
  ]);

  return ok({ notifications, unread }, { meta: buildMeta(page, pageSize, total) });
});
