import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const bills = await prisma.billing.findMany({
    include: { patient: { include: { user: true } }, appointment: true },
  });
  return NextResponse.json(bills);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { patient_id, appointment_id, amount } = body;

  try {
    const bill = await prisma.billing.create({
      data: { patient_id, appointment_id, amount },
    });
    return NextResponse.json(bill, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });
  }
}
