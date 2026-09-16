import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invoiceFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { invoice: { findFirst: mocks.invoiceFindFirst } },
}));

const { nextInvoiceNumber } = await import("@/lib/billing");

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-15T00:00:00Z"));
});

describe("nextInvoiceNumber", () => {
  it("starts a new year at 000001", async () => {
    mocks.invoiceFindFirst.mockResolvedValue(null);
    expect(await nextInvoiceNumber()).toBe("INV-2026-000001");
  });

  it("increments from the highest existing number in the current year", async () => {
    mocks.invoiceFindFirst.mockResolvedValue({ number: "INV-2026-000031" });
    expect(await nextInvoiceNumber()).toBe("INV-2026-000032");
  });

  it("only looks at invoices prefixed with the current year", async () => {
    mocks.invoiceFindFirst.mockResolvedValue(null);
    await nextInvoiceNumber();

    const arg = mocks.invoiceFindFirst.mock.calls[0][0];
    expect(arg.where.number.startsWith).toBe("INV-2026-");
  });
});
