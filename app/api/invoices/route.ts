import { InvoiceStatus, NotificationType, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildMeta, created, ok, parseBody, parseQuery, route } from "@/lib/api";
import { requireRole, requireSession } from "@/lib/auth";
import { createInvoiceSchema, paginationSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { nextInvoiceNumber } from "@/lib/billing";

// Replaces the old /api/billing route, which called `prisma.billing` — a model
// that never existed — and so returned a 500 on every request.
//
// This system records invoices and payments. It does NOT process payments and
// integrates with no payment gateway; Payment rows are ledger entries created by
// staff. The schema is shaped so a gateway can be added later without migration.

const INCLUDE = {
  items: true,
  payments: true,
  patient: { select: { id: true, mrn: true, user: { select: { id: true, name: true } } } },
} satisfies Prisma.InvoiceInclude;

const querySchema = paginationSchema.extend({
  status: paginationSchema.shape.q.optional(),
});

export const GET = route(async (req: Request) => {
  const session = await requireSession();
  const { page, pageSize } = parseQuery(req, querySchema);

  let where: Prisma.InvoiceWhereInput = {};
  if (session.user.role === Role.PATIENT) {
    const own = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    where = { patientId: own?.id ?? -1, status: { not: InvoiceStatus.DRAFT } };
  } else if (session.user.role === Role.DOCTOR) {
    // Doctors have no billing visibility.
    where = { id: -1 };
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: INCLUDE,
      orderBy: { issuedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.count({ where }),
  ]);

  return ok(invoices, { meta: buildMeta(page, pageSize, total) });
});

export const POST = route(async (req: Request) => {
  const session = await requireRole(Role.ADMIN, Role.STAFF);
  const input = await parseBody(req, createInvoiceSchema);

  // Totals are computed server-side. A client-supplied total must never be
  // trusted on a billing document.
  const items = input.items.map((i) => ({
    description: i.description,
    quantity: i.quantity,
    unitPrice: new Prisma.Decimal(i.unitPrice),
    amount: new Prisma.Decimal(i.unitPrice).mul(i.quantity),
  }));

  const subtotal = items.reduce(
    (sum, i) => sum.add(i.amount),
    new Prisma.Decimal(0),
  );
  const total = subtotal
    .sub(new Prisma.Decimal(input.discount))
    .add(new Prisma.Decimal(input.tax));

  const invoice = await prisma.invoice.create({
    data: {
      number: await nextInvoiceNumber(),
      patientId: input.patientId,
      appointmentId: input.appointmentId ?? null,
      dueAt: input.dueAt ?? null,
      notes: input.notes || null,
      subtotal,
      discount: new Prisma.Decimal(input.discount),
      tax: new Prisma.Decimal(input.tax),
      total,
      status: InvoiceStatus.PENDING,
      items: { create: items },
    },
    include: INCLUDE,
  });

  await recordAudit({
    actorId: session.user.id,
    action: "invoice.created",
    entity: "Invoice",
    entityId: invoice.id,
    summary: invoice.number,
  });

  await notify({
    userId: invoice.patient.user.id,
    type: NotificationType.BILLING,
    title: `Invoice ${invoice.number} issued`,
    body: `Amount due: ${invoice.total.toString()}`,
    link: "/dashboard/user",
  });

  return created(invoice);
});
