import { InvoiceStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, parseId, route, HttpError } from "@/lib/api";
import { isStaff, requireSession } from "@/lib/auth";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";

type Ctx = { params: Promise<{ id: string }> };

/// Creates a Stripe Checkout Session for an invoice's outstanding balance and
/// returns the URL to redirect the browser to. The invoice is NOT marked paid
/// here — only the webhook (POST /api/webhooks/stripe), on a verified
/// checkout.session.completed event, does that. This endpoint only starts
/// the checkout; it has no side effect on the invoice itself.
export const POST = route(async (_req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const invoiceId = parseId((await ctx.params).id, "invoice id");

  if (!isStripeConfigured()) {
    throw new HttpError(501, "Online payments are not configured for this deployment");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true, patient: { select: { userId: true } } },
  });
  if (!invoice) throw new HttpError(404, "Invoice not found");

  // A patient may only pay their own invoice; staff may initiate on behalf of
  // a patient (e.g. at the front desk, handing them a phone to tap "pay").
  if (!isStaff(session.user.role) && invoice.patient.userId !== session.user.id) {
    throw new HttpError(403, "Forbidden");
  }

  if (invoice.status === InvoiceStatus.CANCELLED || invoice.status === InvoiceStatus.PAID) {
    throw new HttpError(409, `This invoice is already ${invoice.status.toLowerCase()}`);
  }

  const alreadyPaid = invoice.payments.reduce((sum, p) => sum.add(p.amount), new Prisma.Decimal(0));
  const outstanding = invoice.total.sub(alreadyPaid);
  if (outstanding.lessThanOrEqualTo(0)) {
    throw new HttpError(409, "Nothing is outstanding on this invoice");
  }

  const settings = await prisma.hospitalSettings.findUnique({ where: { id: 1 } });
  // Stripe wants a lowercase ISO currency code. HospitalSettings.currency is a
  // free-text display label (e.g. "ETB") that is not necessarily one Stripe
  // supports — this is a real limitation, not an oversight; see the README.
  const currency = (settings?.currency || "usd").toLowerCase();

  const stripe = getStripeClient();
  if (!stripe) throw new HttpError(501, "Online payments are not configured for this deployment");

  const origin = new URL(_req.url).origin;
  const returnPath = isStaff(session.user.role) ? "/dashboard/admin/billing" : "/dashboard/user";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: Math.round(outstanding.toNumber() * 100),
          product_data: { name: `Invoice ${invoice.number}` },
        },
        quantity: 1,
      },
    ],
    metadata: { invoiceId: String(invoiceId) },
    success_url: `${origin}${returnPath}?paid=${invoice.number}`,
    cancel_url: `${origin}${returnPath}`,
  });

  if (!checkoutSession.url) {
    throw new HttpError(502, "Could not start checkout. Try again.");
  }

  return ok({ url: checkoutSession.url });
});
