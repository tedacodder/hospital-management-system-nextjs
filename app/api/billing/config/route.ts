import { ok, route } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";

/// Tells the client whether to show a "Pay online" button at all. This is not
/// a security boundary — it's a UX check so the button never appears for a
/// deployment that hasn't configured Stripe, only to fail on click.
export const GET = route(async () => {
  await requireSession();
  return ok({ onlinePaymentsEnabled: isStripeConfigured() });
});
