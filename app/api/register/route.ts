import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, role, age = "", gender = "", phone = "" } = await req.json();

    // Only validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Try to create user
    try {
      const user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role,
          age,
          gender,
          phone,
        },
      });
      return NextResponse.json({ user }, { status: 201 });
    } catch (err: any) {
      // Handle unique constraint error
      if (err.code === "P2002") {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 });
      }
      throw err;
    }

  } catch (err) {
    console.error("Error creating user:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
