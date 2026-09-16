import { AppointmentStatus, InvoiceStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, route } from "@/lib/api";
import { isStaff, requireSession } from "@/lib/auth";

// Every figure below is a real aggregate over the database. Nothing is seeded,
// sampled or estimated — if a table is empty the figure is zero, and the UI is
// expected to render an empty state rather than a placeholder number.

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/// Appointment counts per day for the last `days` days, for the trend chart.
async function appointmentTrend(days: number, where: Prisma.AppointmentWhereInput) {
  const from = startOfToday();
  from.setDate(from.getDate() - (days - 1));

  const rows = await prisma.appointment.findMany({
    where: { ...where, date: { gte: from } },
    select: { date: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const key = r.date.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets, ([date, count]) => ({ date, count }));
}

export const GET = route(async () => {
  const session = await requireSession();
  const todayStart = startOfToday();
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // ── Staff / admin: whole-organisation view ──
  if (isStaff(session.user.role)) {
    const [
      totalPatients,
      activeDoctors,
      departments,
      todaysAppointments,
      upcoming,
      byStatus,
      outstanding,
      recentPatients,
      recentAppointments,
      trend,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.doctor.count({ where: { user: { isActive: true } } }),
      prisma.department.count({ where: { isActive: true } }),
      prisma.appointment.count({ where: { date: { gte: todayStart, lt: todayEnd } } }),
      prisma.appointment.count({
        where: {
          date: { gte: todayEnd },
          status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        },
      }),
      prisma.appointment.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.invoice.aggregate({
        where: { status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      prisma.patient.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, mrn: true, createdAt: true, user: { select: { name: true } } },
      }),
      prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          date: true,
          status: true,
          department: true,
          patient: { select: { user: { select: { name: true } } } },
        },
      }),
      appointmentTrend(30, {}),
    ]);

    return ok({
      scope: "staff",
      kpis: {
        totalPatients,
        activeDoctors,
        departments,
        todaysAppointments,
        upcomingAppointments: upcoming,
        outstandingInvoices: outstanding._count._all,
        outstandingAmount: outstanding._sum.total?.toString() ?? "0",
      },
      appointmentsByStatus: byStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
      appointmentTrend: trend,
      recentPatients,
      recentAppointments,
    });
  }

  // ── Doctor: own schedule only ──
  if (session.user.role === Role.DOCTOR) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    const scope = { doctorId: doctor?.id ?? -1 };

    const [today, upcoming, completed, distinctPatients, byStatus, trend, schedule] =
      await Promise.all([
        prisma.appointment.count({
          where: { ...scope, date: { gte: todayStart, lt: todayEnd } },
        }),
        prisma.appointment.count({
          where: {
            ...scope,
            date: { gte: todayEnd },
            status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
          },
        }),
        prisma.appointment.count({
          where: { ...scope, status: AppointmentStatus.COMPLETED },
        }),
        prisma.appointment.findMany({
          where: scope,
          distinct: ["patientId"],
          select: { patientId: true },
        }),
        prisma.appointment.groupBy({
          by: ["status"],
          where: scope,
          _count: { _all: true },
        }),
        appointmentTrend(30, scope),
        prisma.appointment.findMany({
          where: { ...scope, date: { gte: todayStart, lt: todayEnd } },
          orderBy: { date: "asc" },
          select: {
            id: true,
            date: true,
            status: true,
            reason: true,
            patient: { select: { id: true, mrn: true, user: { select: { name: true } } } },
          },
        }),
      ]);

    return ok({
      scope: "doctor",
      doctorId: doctor?.id ?? null,
      kpis: {
        todaysAppointments: today,
        upcomingAppointments: upcoming,
        completedAppointments: completed,
        totalPatients: distinctPatients.length,
      },
      appointmentsByStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
      appointmentTrend: trend,
      todaysSchedule: schedule,
    });
  }

  // ── Patient: own record only ──
  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const patientId = patient?.id ?? -1;

  const [upcoming, past, prescriptions, outstanding, nextAppointment] = await Promise.all([
    prisma.appointment.count({
      where: {
        patientId,
        date: { gte: new Date() },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      },
    }),
    prisma.appointment.count({
      where: { patientId, status: AppointmentStatus.COMPLETED },
    }),
    prisma.prescription.count({ where: { patientId, status: "ACTIVE" } }),
    prisma.invoice.aggregate({
      where: {
        patientId,
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] },
      },
      _sum: { total: true },
    }),
    prisma.appointment.findFirst({
      where: {
        patientId,
        date: { gte: new Date() },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        department: true,
        status: true,
        doctor: { select: { user: { select: { name: true } } } },
      },
    }),
  ]);

  return ok({
    scope: "patient",
    patientId: patient?.id ?? null,
    kpis: {
      upcomingAppointments: upcoming,
      pastAppointments: past,
      activePrescriptions: prescriptions,
      outstandingAmount: outstanding._sum.total?.toString() ?? "0",
    },
    nextAppointment,
  });
});
