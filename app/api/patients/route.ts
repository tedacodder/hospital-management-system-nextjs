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
  const { name, email, password = "", gender, phone, address, age, date_of_birth } = body;

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
        age: String(age), // ✅ convert to string
        gender,           // ✅ include if non-nullable
      },
    });

    // Create patient profile
    const patient = await prisma.patient.create({
      data: {
        user_id: user.id,
        date_of_birth: new Date(date_of_birth), // ✅ ensure valid date
        gender,
      },
    });

    return NextResponse.json({ user, patient }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Error creating patient:", err);
    return NextResponse.json({ error: err.message || "Failed to create patient" }, { status: 500 });
  }
}
