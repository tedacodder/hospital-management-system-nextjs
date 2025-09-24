import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all users
export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}

// POST new user (generic – used for admin creation, etc.)
export async function POST(req: Request) {
  const body = await req.json();
  const { full_name, email, password_hash, role, contact_number } = body;

  try {
    const user = await prisma.user.create({
      data: { full_name, email, password_hash, role, contact_number },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
