// app/api/chats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET chats for a user
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = parseInt(searchParams.get("user_id") || "0");

  const chats = await prisma.chatParticipant.findMany({
    where: { user_id },
    include: {
      chat: {
        include: {
          messages: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
          participants: { include: { user: true } },
        },
      },
    },
  });

  return NextResponse.json(chats);
}
