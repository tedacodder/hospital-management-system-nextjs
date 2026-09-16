import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { created, ok, parseId, parseBody, route, HttpError } from "@/lib/api";
import { requireSession, type AuthedSession } from "@/lib/auth";
import { createMessageSchema } from "@/lib/validation";
import { notify } from "@/lib/notify";

type Ctx = { params: Promise<{ id: string }> };

/// Membership is the authorization rule for messaging: you may read and write a
/// conversation if and only if you are a participant.
async function assertParticipant(session: AuthedSession, conversationId: number) {
  const member = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: session.user.id } },
    select: { id: true },
  });
  if (!member) throw new HttpError(403, "You are not part of this conversation");
  return member;
}

export const GET = route(async (_req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const conversationId = parseId((await ctx.params).id, "conversation id");
  await assertParticipant(session, conversationId);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      body: true,
      createdAt: true,
      sender: { select: { id: true, name: true, role: true } },
    },
  });

  // Opening the thread marks it read for this participant.
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId: session.user.id } },
    data: { lastReadAt: new Date() },
  });

  return ok(messages);
});

export const POST = route(async (req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const conversationId = parseId((await ctx.params).id, "conversation id");
  await assertParticipant(session, conversationId);

  const input = await parseBody(req, createMessageSchema);

  const message = await prisma.$transaction(async (tx) => {
    const m = await tx.message.create({
      data: { conversationId, senderId: session.user.id, body: input.body },
      select: {
        id: true,
        body: true,
        createdAt: true,
        sender: { select: { id: true, name: true, role: true } },
      },
    });
    // Bump the thread so conversation ordering reflects real activity.
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return m;
  });

  // Notify every other participant. This is a one-off notification, not a
  // running unread count — the conversation list's own hasUnread flag (derived
  // from lastReadAt) handles that.
  const others = await prisma.conversationParticipant.findMany({
    where: { conversationId, NOT: { userId: session.user.id } },
    select: { userId: true },
  });
  await Promise.all(
    others.map((p) =>
      notify({
        userId: p.userId,
        type: NotificationType.MESSAGE,
        title: `New message from ${session.user.name ?? "someone"}`,
        body: input.body.slice(0, 140),
        link: "/dashboard/messages",
      }),
    ),
  );

  return created(message);
});
