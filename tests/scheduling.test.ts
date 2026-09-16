import { describe, expect, it } from "vitest";
import { minutesSinceMidnight, overlaps } from "@/lib/scheduling";

describe("minutesSinceMidnight", () => {
  it("converts HH:mm to minutes", () => {
    expect(minutesSinceMidnight("00:00")).toBe(0);
    expect(minutesSinceMidnight("09:30")).toBe(570);
    expect(minutesSinceMidnight("23:59")).toBe(1439);
  });
});

describe("overlaps", () => {
  const at = (hhmm: string) => new Date(`2026-09-15T${hhmm}:00`);

  it("detects a direct overlap", () => {
    expect(overlaps(at("09:00"), 30, at("09:15"), 30)).toBe(true);
  });

  it("detects identical slots as overlapping", () => {
    expect(overlaps(at("09:00"), 30, at("09:00"), 30)).toBe(true);
  });

  it("treats back-to-back appointments as non-overlapping", () => {
    // The first appointment ends exactly when the second starts — this is the
    // boundary case a double-booking bug most often gets wrong.
    expect(overlaps(at("09:00"), 30, at("09:30"), 30)).toBe(false);
  });

  it("returns false for appointments hours apart", () => {
    expect(overlaps(at("09:00"), 30, at("14:00"), 30)).toBe(false);
  });

  it("detects a short appointment fully inside a long one", () => {
    expect(overlaps(at("09:00"), 120, at("09:45"), 15)).toBe(true);
  });

  it("is symmetric — order of arguments doesn't change the result", () => {
    const a = overlaps(at("09:00"), 30, at("09:15"), 30);
    const b = overlaps(at("09:15"), 30, at("09:00"), 30);
    expect(a).toBe(b);
  });
});
