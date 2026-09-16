import { HttpError } from "@/lib/api";

// A fixed-window limiter held in process memory. This is deliberately simple
// and has a real limitation: it resets on deploy and does not share state
// across multiple instances behind a load balancer. For a multi-instance
// deployment, replace the Map below with Redis (INCR + EXPIRE) — the call
// sites don't need to change, only this file.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Buckets are cheap but not free; without this a long-running process would
// accumulate one entry per distinct key forever. Sweeping occasionally is
// enough — this is a coarse safety net, not a precise limiter.
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

/// Throws 429 if `key` has exceeded `limit` calls within `windowMs`. Call this
/// at the top of a route handler, before touching the database, so a flood of
/// requests never reaches Prisma.
export function rateLimit(key: string, limit: number, windowMs: number): void {
  sweep();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    throw new HttpError(429, `Too many attempts. Try again in ${retryAfterSeconds}s.`);
  }
}

/// Best-effort client identifier from standard proxy headers, falling back to
/// a constant so the limiter still functions (just coarsely) behind a proxy
/// that doesn't set them.
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
