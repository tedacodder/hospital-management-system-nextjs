// app/api/appointments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      age,
      gender,
      contact,
      email,
      date,
      department,
      doctor, // doctor name (optional)
      reason,
      status = "PENDING", // default status
    } = body;

    if (!email || !date || !department || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase();

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: "default_password",
          phone: contact ?? "",
          age: age ?? "",
          gender: gender ?? "",
        },
      });

      // create patient record for new user
      await prisma.patient.create({ data: { userId: user.id } });
    } else {
      // If user exists but no patient? create patient
      const existingPatient = await prisma.patient.findUnique({ where: { userId: user.id } });
      if (!existingPatient) {
        await prisma.patient.create({ data: { userId: user.id } });
      }
    }

    // Find patient (should exist now)
    const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
    if (!patient) {
      return NextResponse.json({ error: "Patient record not found" }, { status: 404 });
    }

    // Find doctor by user.name or leave null
    let doctorRecord = null;
    if (doctor) {
      doctorRecord = await prisma.doctor.findFirst({
        where: { user: { name: doctor } },
      });
    }

    // Create appointment with status
    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(date),
        reason,
        department,
        status, // 👈 include status here
        patientId: patient.id,
        doctorId: doctorRecord ? doctorRecord.id : null,
      },
    });

    // Return created appointment with related user info
    const full = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    return NextResponse.json({ message: "Appointment created", appointment: full }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating appointment:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      // if email not provided, return all appointments (admin)
      const all = await prisma.appointment.findMany({
        include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
        orderBy: { date: "desc" },
      });
      return NextResponse.json(all);
    }

    const normalizedEmail = email.toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find patient
    const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Find appointments for this patient
    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ appointments }, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching appointments:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
