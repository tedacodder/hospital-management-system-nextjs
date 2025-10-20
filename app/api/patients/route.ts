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
  const { name, email, password = "", gender, phone, address, age } = body;
  const existingUser = await prisma.user.findUnique({
  where: { email },
});

if (existingUser) {
  throw new Error("Email already exists");
}
  try {
    const finalPassword = password || "default123";

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: finalPassword,
        role: "PATIENT",
        address,
        phone,
        age: String(age), // convert to string
        gender,           
      },
    });


    // Create patient profile
    const patient = await prisma.patient.create({
  data: {
    user: { connect: { id: user.id } },
    // include any patient-specific fields here
  },
});


    return NextResponse.json({ user, patient }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Error creating patient:", err);
    return NextResponse.json({ error: err.message || "Failed to create patient" }, { status: 500 });
  }
}
