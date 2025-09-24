// app/api/appointments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all appointments
export async function GET() {
  const appointments = await prisma.appointment.findMany({
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true} },
    },
  });
  return NextResponse.json(appointments);
}

// POST new appointment
export async function POST(req: Request) {
  const body = await req.json();
  const { patient_id, doctor_id, appointment_date } = body;

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patient_id,
        doctor_id,
        appointment_date: new Date(appointment_date),
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
