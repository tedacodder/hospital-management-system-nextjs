import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: fetch all users OR fetch by email if query param exists
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (email) {
      const normalizedEmail = email.toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          age: true,
          gender: true,
          phone: true,
          address: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ user });
    }

    // No email query → return all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        age: true,
        gender: true,
        phone: true,
        address: true,
      },
    });
    return NextResponse.json(users);

  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: create new user safely
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      role = "PATIENT",
      age = "",
      gender = "",
      phone = "",
      address = "",
    } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const hashedPassword = password; // Replace with bcrypt.hash(password, 10) if needed

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
          address,
        },
      });
      return NextResponse.json(user, { status: 201 });
    } catch (err: any) {
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
