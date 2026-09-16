import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { created, parseBody, parseId, route } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { createPaymentSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { recordPayment } from "@/lib/billing";

type Ctx = { params: Promise<{ id: string }> };

/// Records a payment against an invoice — cash, card taken in person, bank
/// transfer, and so on. No money moves here; this is bookkeeping for payment
/// collected outside the app. For card payments collected online, see
/// POST /api/invoices/[id]/checkout instead, which reaches this same logic
/// (lib/billing.ts recordPayment) via the Stripe webhook.
export const POST = route(async (req: Request, ctx: Ctx) => {
  const session = await requireRole(Role.ADMIN, Role.STAFF);
  const invoiceId = parseId((await ctx.params).id, "invoice id");
  const input = await parseBody(req, createPaymentSchema);

  const payment = await prisma.$transaction((tx) =>
    recordPayment(tx, {
      invoiceId,
      amount: input.amount,
      method: input.method,
      reference: input.reference,
      paidAt: input.paidAt,
      recordedById: session.user.id,
    }),
  );

  await recordAudit({
    actorId: session.user.id,
    action: "payment.recorded",
    entity: "Invoice",
    entityId: invoiceId,
  });

  return created(payment);
});
