import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const prescriptions = await prisma.prescription.findMany({
    include: { doctor: { include: { user: true } }, patient: { include: { user: true } } },
  });
  return NextResponse.json(prescriptions);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { record_id, doctor_id, patient_id, medicines, notes } = body;

  try {
    const prescription = await prisma.prescription.create({
      data: { record_id, doctor_id, patient_id, medicines, notes },
    });
    return NextResponse.json(prescription, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create prescription" }, { status: 500 });
  }
}
