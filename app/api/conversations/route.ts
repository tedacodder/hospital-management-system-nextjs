import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { created, ok, parseBody, route, HttpError } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { createConversationSchema } from "@/lib/validation";
import { notify } from "@/lib/notify";

// Replaces /api/chats and /api/messages, which referenced `chatParticipant` and
// `message` models that did not exist.
//
// Messaging here is request/response only. There is no WebSocket server and no
// push: clients poll. Nothing in the UI claims messages are real-time.

/// Conversations the caller participates in, newest activity first.
export const GET = route(async () => {
  const session = await requireSession();

  const rows = await prisma.conversationParticipant.findMany({
    where: { userId: session.user.id },
    orderBy: { conversation: { updatedAt: "desc" } },
    select: {
      lastReadAt: true,
      conversation: {
        select: {
          id: true,
          subject: true,
          updatedAt: true,
          participants: {
            select: { user: { select: { id: true, name: true, role: true } } },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, body: true, createdAt: true, senderId: true },
          },
        },
      },
    },
  });

  const conversations = rows.map((row) => {
    const latest = row.conversation.messages[0] ?? null;
    return {
      id: row.conversation.id,
      subject: row.conversation.subject,
      updatedAt: row.conversation.updatedAt,
      participants: row.conversation.participants.map((p) => p.user),
      lastMessage: latest,
      hasUnread: Boolean(
        latest &&
          latest.senderId !== session.user.id &&
          (!row.lastReadAt || latest.createdAt > row.lastReadAt),
      ),
    };
  });

  return ok(conversations);
});

/// Starts a conversation. The creator is always added as a participant, so a
/// caller cannot create a thread between two other people and then read it.
export const POST = route(async (req: Request) => {
  const session = await requireSession();
  const input = await parseBody(req, createConversationSchema);

  const ids = Array.from(new Set([...input.participantIds, session.user.id]));
  if (ids.length < 2) throw new HttpError(400, "Choose someone to message");

  const found = await prisma.user.count({ where: { id: { in: ids }, isActive: true } });
  if (found !== ids.length) throw new HttpError(404, "One or more recipients do not exist");

  const conversation = await prisma.conversation.create({
    data: {
      subject: input.subject || null,
      participants: { create: ids.map((userId) => ({ userId })) },
      messages: { create: { senderId: session.user.id, body: input.body } },
    },
    select: { id: true, subject: true, createdAt: true },
  });

  const recipientIds = ids.filter((id) => id !== session.user.id);
  await Promise.all(
    recipientIds.map((userId) =>
      notify({
        userId,
        type: NotificationType.MESSAGE,
        title: `New message from ${session.user.name ?? "someone"}`,
        body: input.body.slice(0, 140),
        link: "/dashboard/messages",
      }),
    ),
  );

  return created(conversation);
});
