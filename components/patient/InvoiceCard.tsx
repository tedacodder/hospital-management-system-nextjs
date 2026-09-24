import { InvoiceStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChevronDownIcon } from "@/components/ui/Icons";
import type { Invoice } from "@/components/patient/types";
import { canPayOnline, formatDate, formatMoney, invoiceBalance, paymentMethodLabel } from "@/lib/patient-ui";

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-1.5 text-sm ${strong ? "font-semibold text-ink-900" : "text-ink-700"}`}>
      <dt>{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}

/// An invoice with its balance up front and the line items / payment history
/// one disclosure away. Payment itself is the existing checkout flow; this
/// card only decides when to offer it.
export function InvoiceCard({
  invoice: inv,
  onlinePaymentsEnabled,
  paying,
  onPay,
}: {
  invoice: Invoice;
  onlinePaymentsEnabled: boolean;
  paying: boolean;
  onPay: (invoice: Invoice) => void;
}) {
  const balance = invoiceBalance(inv.total, inv.payments);
  const open = inv.status === "PENDING" || inv.status === "OVERDUE";
  const overdue = inv.status === "OVERDUE";
  const hasDiscount = Number(inv.discount) > 0;
  const hasTax = Number(inv.tax) > 0;

  return (
    <Card padded={false}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-ink-500">{inv.number}</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-ink-900">{formatMoney(inv.total)}</p>
          </div>
          <InvoiceStatusBadge status={inv.status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-500">Issued</dt>
            <dd className="mt-0.5 text-ink-900">{formatDate(inv.issuedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500">Due</dt>
            <dd className={`mt-0.5 ${overdue ? "font-medium text-[var(--color-signal-stop)]" : "text-ink-900"}`}>
              {inv.dueAt ? formatDate(inv.dueAt) : "—"}
            </dd>
          </div>
          {open && (
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-xs text-ink-500">Balance due</dt>
              <dd
                className={`mt-0.5 font-mono font-semibold tabular-nums ${
                  overdue ? "text-[var(--color-signal-stop)]" : "text-[var(--color-signal-wait)]"
                }`}
              >
                {formatMoney(balance)}
              </dd>
            </div>
          )}
        </dl>

        {onlinePaymentsEnabled && canPayOnline(inv.status) && (
          <Button className="mt-4 w-full sm:w-auto" loading={paying} onClick={() => onPay(inv)}>
            {paying ? "Opening checkout…" : "Pay online"}
          </Button>
        )}
      </div>

      <details className="group border-t border-rule">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium text-ink-700 transition-colors hover:bg-paper sm:px-5 [&::-webkit-details-marker]:hidden">
          <span>Invoice details</span>
          <ChevronDownIcon className="h-4 w-4 text-ink-500 transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="space-y-5 px-4 pb-5 pt-1 sm:px-5">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-ink-500">Items</h3>
            <ul className="mt-2 divide-y divide-rule">
              {inv.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="text-ink-900">{item.description}</p>
                    {item.quantity > 1 && (
                      <p className="font-mono text-xs text-ink-500">
                        {item.quantity} × {formatMoney(item.unitPrice)}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-mono tabular-nums text-ink-900">{formatMoney(item.amount)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-1 border-t border-rule pt-1.5">
              {(hasDiscount || hasTax) && <Line label="Subtotal" value={formatMoney(inv.subtotal)} />}
              {hasDiscount && <Line label="Discount" value={`−${formatMoney(inv.discount)}`} />}
              {hasTax && <Line label="Tax" value={formatMoney(inv.tax)} />}
              <Line label="Total" value={formatMoney(inv.total)} strong />
            </dl>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-ink-500">Payments</h3>
            {inv.payments.length === 0 ? (
              <p className="mt-2 text-sm text-ink-500">No payments recorded yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-rule">
                {inv.payments.map((pay) => (
                  <li key={pay.id} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                    <div>
                      <p className="text-ink-900">{paymentMethodLabel(pay.method)}</p>
                      <p className="text-xs text-ink-500">
                        {formatDate(pay.paidAt)}
                        {pay.reference ? ` · Ref ${pay.reference}` : ""}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums text-ink-900">{formatMoney(pay.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {inv.notes && <p className="text-sm leading-relaxed text-ink-500">{inv.notes}</p>}
        </div>
      </details>
    </Card>
  );
}
