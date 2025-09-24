import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all doctors
export async function GET() {
  const doctors = await prisma.doctor.findMany({
    include: { user: true, department: true },
  });
  return NextResponse.json(doctors);
}

// POST new doctor
export async function POST(req: Request) {
  const body = await req.json();
  const { full_name, email, password_hash, specialization, department_id } = body;

  try {
    const user = await prisma.user.create({
      data: { full_name, email, password_hash, role: "doctor" },
    });

    const doctor = await prisma.doctor.create({
      data: { user_id: user.user_id, specialization, department_id },
    });

    return NextResponse.json({ user, doctor }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create doctor" }, { status: 500 });
  }
}
