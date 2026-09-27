import { buildMeta, ok, parseQuery, route } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { medicationSearchSchema } from "@/lib/validation";
import { searchMedications } from "@/lib/medications/service";

/// Any authenticated role may search — this is public FDA reference data, not
/// a patient record, so the interesting authorization question isn't "who can
/// read this" but "who can act on it" (see /api/prescriptions, which enforces
/// the real clinical authorization independently of this route).
export const GET = route(async (req: Request) => {
  const session = await requireSession();

  // Rate-limited per user rather than per IP: this proxies every call to a
  // third-party API with its own public rate limit, so one account
  // hammering search shouldn't be able to exhaust it for everyone else.
  rateLimit(`medications-search:${session.user.id}`, 30, 60_000);

  const { q, manufacturer, page, pageSize } = parseQuery(req, medicationSearchSchema);
  const { items, total } = await searchMedications({ q, manufacturer, page, pageSize });

  return ok(items, { meta: buildMeta(page, pageSize, total) });
});
