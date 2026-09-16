import Stripe from "stripe";

// Online card payments via Stripe Checkout are entirely optional. If
// STRIPE_SECRET_KEY is unset, every function here returns null/false and the
// UI hides the "Pay online" button — there is no fake payment flow, and no
// crash on a deployment that never configures this.

let client: Stripe | null | undefined;

export function getStripeClient(): Stripe | null {
  if (client !== undefined) return client;

  const key = process.env.STRIPE_SECRET_KEY;
  client = key
    ? new Stripe(key, {
        apiVersion: "2026-08-26.dahlia",
      })
    : null;
  return client;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function isStripeWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
}
