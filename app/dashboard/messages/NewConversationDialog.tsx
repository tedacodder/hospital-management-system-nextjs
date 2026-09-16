"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { apiGet } from "@/lib/api-client";

type Contact = { userId: number; name: string | null; role: string; detail: string };

type DoctorRow = { user: { id: number; name: string | null }; specialization: string };
type PatientRow = { user: { id: number; name: string | null }; mrn: string | null };

/// Who a caller may start a conversation with. This is a UI convenience, not a
/// security boundary — the API only cares that the caller ends up a
/// participant, which POST /api/conversations guarantees regardless of who
/// else is listed. Doctors is always fetchable; Patients only for staff roles
/// that GET /api/patients permits, so a 403 there is expected for patients and
/// silently ignored.
function useContacts() {
  const { data: session } = useSession();
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const list: Contact[] = [];

      try {
        const doctors = await apiGet<DoctorRow[]>("/doctors", { pageSize: 100 });
        for (const d of doctors) {
          list.push({ userId: d.user.id, name: d.user.name, role: "Doctor", detail: d.specialization });
        }
      } catch {
        // ignore
      }

      if (session?.user?.role !== "PATIENT") {
        try {
          const patients = await apiGet<PatientRow[]>("/patients", { pageSize: 200 });
          for (const p of patients) {
            list.push({ userId: p.user.id, name: p.user.name, role: "Patient", detail: p.mrn ?? "" });
          }
        } catch {
          // ignore — role doesn't permit it
        }
      }

      if (!cancelled) setContacts(list);
    }

    if (session) load();
    return () => {
      cancelled = true;
    };
  }, [session]);

  return contacts;
}

export function NewConversationDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (recipientId: number, body: string) => Promise<void>;
}) {
  const contacts = useContacts();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const filtered = contacts.filter((c) =>
    `${c.name} ${c.detail}`.toLowerCase().includes(query.toLowerCase()),
  );

  async function handleSend() {
    if (!selected || !body.trim()) return;
    setSending(true);
    try {
      await onCreate(selected.userId, body);
      setSelected(null);
      setBody("");
      setQuery("");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="New message">
      <div className="flex flex-col gap-4">
        {!selected ? (
          <>
            <TextField label="Find a doctor or patient" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
            <div className="max-h-64 overflow-y-auto rounded-md border border-rule">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-ink-500">No matches.</p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={`${c.role}-${c.userId}`}
                    onClick={() => setSelected(c)}
                    className="flex w-full items-center justify-between border-b border-rule px-3 py-2.5 text-left text-sm last:border-0 hover:bg-paper"
                  >
                    <span className="text-ink-900">
                      {c.role === "Doctor" ? `Dr. ${c.name}` : c.name}
                    </span>
                    <span className="text-xs text-ink-500">{c.detail}</span>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-md bg-paper px-3 py-2">
              <span className="text-sm font-medium text-ink-900">
                {selected.role === "Doctor" ? `Dr. ${selected.name}` : selected.name}
              </span>
              <button onClick={() => setSelected(null)} className="text-xs text-accent-700 hover:underline">
                Change
              </button>
            </div>
            <TextAreaField label="Message" value={body} onChange={(e) => setBody(e.target.value)} autoFocus />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button loading={sending} disabled={!body.trim()} onClick={handleSend}>
                Send
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
