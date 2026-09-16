import { prisma } from "@/lib/prisma";
import { route, HttpError } from "@/lib/api";
import { recordPayment } from "@/lib/billing";
import { recordAudit } from "@/lib/audit";
import { getStripeClient, isStripeWebhookConfigured } from "@/lib/stripe";
import { PaymentMethod } from "@prisma/client";

// Stripe calls this directly — it is never invoked by the app's own UI, so
// there is no requireSession() here. Trust comes entirely from the verified
// webhook signature, not from a session cookie Stripe doesn't have.
//
// Signature verification needs the exact raw request bytes, so this route
// reads req.text() rather than req.json() — parsing and re-stringifying the
// body would change its bytes and make every signature check fail.
export const POST = route(async (req: Request) => {
  if (!isStripeWebhookConfigured()) {
    // Answer 200 rather than erroring: an unconfigured webhook secret means
    // this deployment hasn't wired Stripe up yet, which isn't Stripe's retry
    // logic's problem to keep hammering.
    return new Response(null, { status: 200 });
  }

  const stripe = getStripeClient();
  if (!stripe) return new Response(null, { status: 200 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) throw new HttpError(400, "Missing stripe-signature header");

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    throw new HttpError(400, "Invalid webhook signature");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const invoiceId = Number(session.metadata?.invoiceId);

    if (Number.isInteger(invoiceId) && invoiceId > 0) {
      const amountTotal = (session.amount_total ?? 0) / 100;

      // Idempotency: Stripe can and does deliver the same event more than
      // once. A payment already recorded with this session's payment_intent
      // as its reference means this event was already processed — skip it
      // rather than double-recording the payment.
      const reference = typeof session.payment_intent === "string" ? session.payment_intent : session.id;
      const existing = await prisma.payment.findFirst({ where: { reference } });

      if (!existing && amountTotal > 0) {
        await prisma.$transaction((tx) =>
          recordPayment(tx, {
            invoiceId,
            amount: amountTotal,
            method: PaymentMethod.CARD,
            reference,
            recordedById: null,
          }),
        );

        await recordAudit({
          action: "payment.recorded_online",
          entity: "Invoice",
          entityId: invoiceId,
          summary: `via Stripe, ${reference}`,
        });
      }
    }
  }

  return new Response(null, { status: 200 });
});
