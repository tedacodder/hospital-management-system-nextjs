// app/api/patients/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all patients
export async function GET() {
  const patient = await prisma.user.findMany({
  where: {role: "PATIENT" },
});
  return NextResponse.json(patient);
}


// POST new patient
export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, password, date_of_birth, gender } = body;

  try {
    // create user first
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role: "PATIENT",
      },
    });

    // create patient profile
    const patient = await prisma.patient.create({
      data: {
        user_id: user.id,
        date_of_birth: new Date(date_of_birth),
        gender,
      },
    });

    return NextResponse.json({ user, patient }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 });
  }
}
