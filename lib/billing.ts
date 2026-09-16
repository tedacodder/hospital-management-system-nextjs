import { InvoiceStatus, PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/api";

/// Generates the next human-readable invoice number, e.g. "INV-2026-000031".
///
/// Derived from the highest existing number in the current year rather than a
/// row count, so deleting an invoice cannot cause a collision. The unique index
/// on Invoice.number is the final guard against a concurrent duplicate.
export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const latest = await prisma.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const sequence = latest ? Number(latest.number.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(sequence).padStart(6, "0")}`;
}

type Tx = Prisma.TransactionClient;

/// Records a payment against an invoice and re-derives its status from the
/// full payment ledger, inside a transaction. Both the staff-entry route
/// (POST /api/invoices/[id]/payments) and the Stripe webhook call this — the
/// rule for "when is an invoice paid" exists in exactly one place so the two
/// paths can't drift apart.
export async function recordPayment(
  tx: Tx,
  input: {
    invoiceId: number;
    amount: Prisma.Decimal | number;
    method: PaymentMethod;
    reference?: string | null;
    paidAt?: Date;
    recordedById?: number | null;
  },
) {
  const invoice = await tx.invoice.findUnique({
    where: { id: input.invoiceId },
    include: { payments: true },
  });
  if (!invoice) throw new HttpError(404, "Invoice not found");
  if (invoice.status === InvoiceStatus.CANCELLED) {
    throw new HttpError(409, "Cannot record a payment on a cancelled invoice");
  }

  const alreadyPaid = invoice.payments.reduce(
    (sum, p) => sum.add(p.amount),
    new Prisma.Decimal(0),
  );
  const amount = new Prisma.Decimal(input.amount);
  const outstanding = invoice.total.sub(alreadyPaid);

  if (amount.greaterThan(outstanding)) {
    throw new HttpError(422, `Amount exceeds the outstanding balance of ${outstanding.toString()}`);
  }

  const payment = await tx.payment.create({
    data: {
      invoiceId: input.invoiceId,
      amount,
      method: input.method,
      reference: input.reference || null,
      paidAt: input.paidAt ?? new Date(),
      recordedById: input.recordedById ?? null,
    },
  });

  const settled = alreadyPaid.add(amount).greaterThanOrEqualTo(invoice.total);
  await tx.invoice.update({
    where: { id: input.invoiceId },
    data: { status: settled ? InvoiceStatus.PAID : InvoiceStatus.PENDING },
  });

  return payment;
}
