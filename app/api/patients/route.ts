// app/api/patients/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all patients
export async function GET() {
  const patients = await prisma.patient.findMany({
    include: { user: true },
  });
  return NextResponse.json(patients);
}

// POST new patient
export async function POST(req: Request) {
  const body = await req.json();
  const { full_name, email, password_hash, date_of_birth, gender } = body;

  try {
    // create user first
    const user = await prisma.user.create({
      data: {
        full_name,
        email,
        password_hash,
        role: "patient",
      },
    });

    // create patient profile
    const patient = await prisma.patient.create({
      data: {
        user_id: user.user_id,
        date_of_birth: new Date(date_of_birth),
        gender,
      },
    });

    return NextResponse.json({ user, patient }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 });
  }
}
