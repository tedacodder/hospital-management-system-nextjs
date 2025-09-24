import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const notifications = await prisma.notification.findMany();
  return NextResponse.json(notifications);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { user_id, message } = body;

  try {
    const notification = await prisma.notification.create({
      data: { user_id, message },
    });
    return NextResponse.json(notification, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}
