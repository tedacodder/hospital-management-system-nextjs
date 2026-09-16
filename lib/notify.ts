import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/// Creates an in-app notification. There is no email or SMS delivery in this
/// application — notifications are read from the notification centre only.
export async function notify(input: {
  userId: number;
  type?: NotificationType;
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type ?? NotificationType.SYSTEM,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });
  } catch (err) {
    console.error("[notify] failed to create notification:", err);
  }
}
