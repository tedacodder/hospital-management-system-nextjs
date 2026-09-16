import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { recordPayment } from "@/lib/billing";

// recordPayment builds its own `new Prisma.Decimal(...)` internally, which
// under Vitest resolves to the test shim in tests/mocks/prisma-client.ts (see
// vitest.config.ts). These tests use that same class for invoice.total and
// payment amounts so arithmetic between "our" Decimals and billing.ts's own
// Decimals actually interoperates, the way two real decimal.js instances would.
function tx(opts: { status: string; total: number; paid: number[] }) {
  return {
    invoice: {
      findUnique: vi.fn().mockResolvedValue({
        status: opts.status,
        total: new Prisma.Decimal(opts.total),
        payments: opts.paid.map((amount) => ({ amount: new Prisma.Decimal(amount) })),
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    payment: {
      create: vi.fn(async (args: { data: Record<string, unknown> }) => ({ id: 1, ...args.data })),
    },
  };
}

describe("recordPayment", () => {
  it("throws 404 when the invoice does not exist", async () => {
    const t = { invoice: { findUnique: vi.fn().mockResolvedValue(null) }, payment: {} };
    await expect(
      recordPayment(t as Parameters<typeof recordPayment>[0], { invoiceId: 1, amount: 10, method: "CASH" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws 409 on a cancelled invoice", async () => {
    const t = tx({ status: "CANCELLED", total: 100, paid: [] });
    await expect(
      recordPayment(t as Parameters<typeof recordPayment>[0], { invoiceId: 1, amount: 10, method: "CASH" }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("rejects a payment larger than the outstanding balance", async () => {
    const t = tx({ status: "PENDING", total: 100, paid: [40] });
    await expect(
      recordPayment(t as Parameters<typeof recordPayment>[0], { invoiceId: 1, amount: 61, method: "CASH" }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it("accepts a payment exactly matching the outstanding balance", async () => {
    const t = tx({ status: "PENDING", total: 100, paid: [40] });
    const payment = await recordPayment(t as Parameters<typeof recordPayment>[0], { invoiceId: 1, amount: 60, method: "CASH" });
    expect(payment).toBeTruthy();
    expect(t.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PAID" }) }),
    );
  });

  it("leaves the invoice PENDING when the payment only partially covers it", async () => {
    const t = tx({ status: "PENDING", total: 100, paid: [] });
    await recordPayment(t as Parameters<typeof recordPayment>[0], { invoiceId: 1, amount: 30, method: "CASH" });
    expect(t.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PENDING" }) }),
    );
  });

  it("defaults reference to null rather than an empty string", async () => {
    const t = tx({ status: "PENDING", total: 100, paid: [] });
    await recordPayment(t as Parameters<typeof recordPayment>[0], { invoiceId: 1, amount: 10, method: "CASH", reference: "" });
    expect(t.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reference: null }) }),
    );
  });
});
