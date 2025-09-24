import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const files = await prisma.file.findMany({
    include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
  });
  return NextResponse.json(files);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { patient_id, doctor_id, record_id, file_url, file_type } = body;

  try {
    const file = await prisma.file.create({
      data: { patient_id, doctor_id, record_id, file_url, file_type },
    });
    return NextResponse.json(file, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
