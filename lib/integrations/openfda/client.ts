import { setDefaultResultOrder } from "node:dns";
import { Agent, setGlobalDispatcher } from "undici";
import { HttpError } from "@/lib/api";
import type { OpenFdaLabelResponse } from "./types";

// dns.setDefaultResultOrder only reorders which address family is tried
// first — it doesn't stop Node from attempting IPv6 at all. On this network,
// IPv6 to api.fda.gov isn't rejected instantly (the way curl's OS-level
// route check rejects it) but hangs until Node's own connection timeout
// fires, adding a fixed ~500ms failure to every single request. Forcing the
// global fetch dispatcher to open IPv4-only sockets skips the IPv6 attempt
// entirely rather than just deprioritizing it.
setDefaultResultOrder("ipv4first");
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

// Thin wrapper around the public openFDA Drug Label API
// (https://open.fda.gov/apis/drug/label/). No API key is required to use
// this endpoint; OPENFDA_API_KEY is read only if the deployment has one,
// which raises openFDA's per-key rate limit but changes nothing else.
const BASE_URL = (process.env.OPENFDA_BASE_URL || "https://api.fda.gov").replace(/\/$/, "");
const API_KEY = process.env.OPENFDA_API_KEY || undefined;
const TIMEOUT_MS = 8000;

// A tiny in-memory TTL cache, the same shape as the fixed-window map in
// lib/rate-limit.ts. Drug labeling data is updated on a weekly cadence at
// most (see the "Frequency of API updates" note on open.fda.gov), so caching
// identical queries for a few minutes cuts real load on openFDA's public rate
// limit without ever risking materially stale safety information. Like
// rate-limit.ts, this resets on deploy and does not share state across
// multiple instances — acceptable for a read-through cache of public data.
type CacheEntry = { data: OpenFdaLabelResponse; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60_000;
const CACHE_MAX_ENTRIES = 500;

function cacheGet(key: string): OpenFdaLabelResponse | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function cacheSet(key: string, data: OpenFdaLabelResponse): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}
/// Transient, retry-worthy failure codes — DNS hiccups and dropped
/// connections that are likely to succeed on a second attempt on a flaky
/// network. Deliberately excludes anything that means "the server answered
/// and said no" (429, 5xx, a real 4xx) — those are handled by status code
/// after a successful response, not retried here.
const RETRYABLE_CODES = new Set(["ENOTFOUND", "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN"]);

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as NodeJS.ErrnoException).code ?? (err.cause as NodeJS.ErrnoException | undefined)?.code;
  return code !== undefined && RETRYABLE_CODES.has(code);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


/// Queries GET /drug/label.json. `search` is a raw openFDA/Lucene search
/// expression (see lib/medications/service.ts for how it's built and
/// sanitized) — this function only handles transport: timeout, HTTP status
/// mapping, and caching. It never throws for "no results", only for actual
/// failures, so callers can treat an empty list and a real error differently.
export async function fetchDrugLabels(params: { search: string; skip: number; limit: number }): Promise<OpenFdaLabelResponse> {
  const query = new URLSearchParams({
    search: params.search,
    skip: String(params.skip),
    limit: String(params.limit),
  });
  if (API_KEY) query.set("api_key", API_KEY);

  const cacheKey = query.toString();
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const url = `${BASE_URL}/drug/label.json?${query.toString()}`;
  const MAX_ATTEMPTS = 3;

  let res: Response | undefined;
  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
        break;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          throw new HttpError(504, "The medication reference service timed out. Try again.");
        }
        if (attempt === MAX_ATTEMPTS || !isRetryable(err)) {
          console.error(`[openfda] fetch failed after ${attempt} attempt(s):`, err);
          throw new HttpError(502, "Couldn't reach the medication reference service.");
        }
        // Brief backoff before retrying a transient DNS/connection failure.
        await sleep(150 * attempt);
      }
    }
  } finally {
    clearTimeout(timeout);
  }
  // `res` is always assigned here: the loop above either returns a response
  // or throws before falling through.
  res = res as Response;

  if (res.status === 404) {
    // openFDA's documented convention for "no matches" is a 404 with an
    // {error:{code:"NOT_FOUND", ...}} body — that's an empty result, not a
    // failure, so it's cached and returned like any other successful query.
    const empty: OpenFdaLabelResponse = {
      meta: { results: { skip: params.skip, limit: params.limit, total: 0 } },
      results: [],
    };
    cacheSet(cacheKey, empty);
    return empty;
  }

  if (res.status === 429) {
    throw new HttpError(429, "The medication reference service is rate-limited right now. Try again shortly.");
  }

  if (res.status >= 500) {
    throw new HttpError(502, "The medication reference service is unavailable right now.");
  }

  if (!res.ok) {
    throw new HttpError(502, "The medication reference service returned an unexpected error.");
  }

  let json: OpenFdaLabelResponse;
  try {
    json = await res.json();
  } catch {
    throw new HttpError(502, "The medication reference service returned an unreadable response.");
  }

  cacheSet(cacheKey, json);
  return json;
}
