// app/api/messages/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { chat_id, sender_id, content } = body;

  const message = await prisma.message.create({
    data: { chat_id, sender_id, content },
  });

  // TODO: Broadcast via WebSocket
  return NextResponse.json(message);
}
