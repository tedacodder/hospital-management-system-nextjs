"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { InvoiceStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, LoadingRows } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { SelectField, TextField } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import {
  apiGet,
  apiGetPaged,
  apiSend,
  ApiError,
  type ApiMeta,
} from "@/lib/api-client";

type Invoice = {
  id: number;
  number: string;
  status: string;
  total: string;
  issuedAt: string;
  dueAt: string | null;
  patient: { id: number; mrn: string | null; user: { name: string | null } };
  payments: { id: number; amount: string }[];
};

type PatientOption = {
  id: number;
  mrn: string | null;
  user: { name: string | null };
};

type Line = { description: string; quantity: string; unitPrice: string };

const emptyLine = (): Line => ({
  description: "",
  quantity: "1",
  unitPrice: "",
});

export default function AdminBillingClient() {
  const { push } = useToast();
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [page, setPage] = useState(1);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [payFor, setPayFor] = useState<Invoice | null>(null);

  function load() {
    apiGetPaged<Invoice[]>("/invoices", { page, pageSize: 20 })
      .then(({ data, meta }) => {
        setInvoices(data);
        setMeta(meta);
      })
      .catch(() => setInvoices([]));
  }

  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    apiGet<PatientOption[]>("/patients", { pageSize: 100 })
      .then(setPatients)
      .catch(() => {});
  }, []);

  function outstanding(inv: Invoice): number {
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    return Number(inv.total) - paid;
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Billing</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          New invoice
        </Button>
      </div>

      <div className="mt-4">
        {invoices === null ? (
          <LoadingRows rows={6} />
        ) : invoices.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            body="Create the first invoice above."
          />
        ) : (
          <Card padded={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-rule bg-paper text-xs text-ink-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Invoice</th>
                    <th className="px-4 py-2.5 font-medium">Patient</th>
                    <th className="px-4 py-2.5 font-medium">Issued</th>
                    <th className="px-4 py-2.5 font-medium">Total</th>
                    <th className="px-4 py-2.5 font-medium">Outstanding</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {invoices.map((inv) => {
                    const owed = outstanding(inv);
                    return (
                      <tr key={inv.id}>
                        <td className="px-4 py-3 font-mono text-ink-900">
                          {inv.number}
                        </td>
                        <td className="px-4 py-3 text-ink-900">
                          {inv.patient.user.name}
                        </td>
                        <td className="px-4 py-3 text-ink-500">
                          {new Date(inv.issuedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-ink-900">
                          {inv.total}
                        </td>
                        <td className="px-4 py-3 font-mono text-ink-700">
                          {owed.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <InvoiceStatusBadge status={inv.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {owed > 0 && (
                            <button
                              onClick={() => setPayFor(inv)}
                              className="text-xs font-medium text-accent-700 hover:underline"
                            >
                              Record payment
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPageChange={setPage} />
          </Card>
        )}
      </div>

      <CreateInvoiceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        patients={patients}
        onCreated={() => {
          push("Invoice created.");
          load();
        }}
      />

      {payFor && (
        <RecordPaymentDialog
          invoice={payFor}
          outstanding={outstanding(payFor)}
          onClose={() => setPayFor(null)}
          onRecorded={() => {
            push("Payment recorded.");
            setPayFor(null);
            load();
          }}
        />
      )}
    </AppShell>
  );
}

function CreateInvoiceDialog({
  open,
  onClose,
  patients,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  patients: PatientOption[];
  onCreated: () => void;
}) {
  const [patientId, setPatientId] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total =
    lines.reduce(
      (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
      0,
    ) -
    (Number(discount) || 0) +
    (Number(tax) || 0);

  function reset() {
    setPatientId("");
    setLines([emptyLine()]);
    setDiscount("0");
    setTax("0");
    setDueAt("");
    setError(null);
  }

  async function handleCreate() {
    const items = lines
      .filter((l) => l.description.trim() && l.unitPrice)
      .map((l) => ({
        description: l.description,
        quantity: Number(l.quantity) || 1,
        unitPrice: Number(l.unitPrice),
      }));

    if (!patientId || items.length === 0) {
      setError("Choose a patient and add at least one line item.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiSend("POST", "/invoices", {
        patientId: Number(patientId),
        items,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      });
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't create the invoice.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="New invoice">
      <div className="flex flex-col gap-4">
        <SelectField
          label="Patient"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
        >
          <option value="">Select a patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.user.name} {p.mrn ? `(${p.mrn})` : ""}
            </option>
          ))}
        </SelectField>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-ink-700">Line items</p>
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-[1fr_5rem_6rem] gap-2">
              <TextField
                label={i === 0 ? "Description" : ""}
                value={line.description}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...next[i], description: e.target.value };
                  setLines(next);
                }}
              />
              <TextField
                label={i === 0 ? "Qty" : ""}
                inputMode="numeric"
                value={line.quantity}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...next[i], quantity: e.target.value };
                  setLines(next);
                }}
              />
              <TextField
                label={i === 0 ? "Unit price" : ""}
                inputMode="decimal"
                value={line.unitPrice}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...next[i], unitPrice: e.target.value };
                  setLines(next);
                }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLines([...lines, emptyLine()])}
            className="self-start text-xs font-medium text-accent-700 hover:underline"
          >
            + Add line
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <TextField
            label="Discount"
            inputMode="decimal"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
          <TextField
            label="Tax"
            inputMode="decimal"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
          />
          <TextField
            label="Due date"
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </div>

        <p className="text-right text-sm font-medium text-ink-900">
          Total: <span className="font-mono">{total.toFixed(2)}</span>
        </p>

        {error && (
          <p
            role="alert"
            className="rounded-md bg-[var(--color-signal-stop-bg)] px-3 py-2 text-sm text-[var(--color-signal-stop)]"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={handleCreate}>
            Create invoice
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function RecordPaymentDialog({
  invoice,
  outstanding,
  onClose,
  onRecorded,
}: {
  invoice: Invoice;
  outstanding: number;
  onClose: () => void;
  onRecorded: () => void;
}) {
  const [amount, setAmount] = useState(outstanding.toFixed(2));
  const [method, setMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await apiSend("POST", `/invoices/${invoice.id}/payments`, {
        amount: Number(amount),
        method,
        reference: reference || undefined,
      });
      onRecorded();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't record that payment.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title={`Record payment — ${invoice.number}`}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-500">
          Outstanding balance:{" "}
          <span className="font-mono font-medium text-ink-900">
            {outstanding.toFixed(2)}
          </span>
        </p>
        <TextField
          label="Amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <SelectField
          label="Method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="CASH">Cash</option>
          <option value="CARD">Card</option>
          <option value="BANK_TRANSFER">Bank transfer</option>
          <option value="MOBILE_MONEY">Mobile money</option>
          <option value="INSURANCE">Insurance</option>
        </SelectField>
        <TextField
          label="Reference (optional)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />

        {error && (
          <p
            role="alert"
            className="rounded-md bg-[var(--color-signal-stop-bg)] px-3 py-2 text-sm text-[var(--color-signal-stop)]"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={handleSave}>
            Record payment
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
