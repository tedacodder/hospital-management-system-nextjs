import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const records = await prisma.medicalRecord.findMany({
    include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
  });
  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { patient_id, doctor_id, diagnosis, treatment } = body;

  try {
    const record = await prisma.medicalRecord.create({
      data: { patient_id, doctor_id, diagnosis, treatment },
    });
    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
  }
}
