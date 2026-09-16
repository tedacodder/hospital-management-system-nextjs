import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-15T00:00:00Z"));
});

describe("rateLimit", () => {
  it("allows calls up to the limit", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(() => rateLimit(key, 5, 60_000)).not.toThrow();
    }
  });

  it("throws once the limit is exceeded", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000);
    expect(() => rateLimit(key, 5, 60_000)).toThrow(HttpError);
  });

  it("resets after the window elapses", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000);
    expect(() => rateLimit(key, 5, 60_000)).toThrow();

    vi.advanceTimersByTime(60_001);
    expect(() => rateLimit(key, 5, 60_000)).not.toThrow();
  });

  it("tracks separate keys independently", () => {
    const a = `test-a-${Math.random()}`;
    const b = `test-b-${Math.random()}`;
    for (let i = 0; i < 5; i++) rateLimit(a, 5, 60_000);
    // b has its own budget even though a is exhausted.
    expect(() => rateLimit(b, 5, 60_000)).not.toThrow();
  });
});

describe("clientIp", () => {
  it("reads the first address from x-forwarded-for", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(clientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = new Request("https://example.com", { headers: { "x-real-ip": "203.0.113.9" } });
    expect(clientIp(req)).toBe("203.0.113.9");
  });

  it("falls back to 'unknown' when neither header is present", () => {
    const req = new Request("https://example.com");
    expect(clientIp(req)).toBe("unknown");
  });
});
