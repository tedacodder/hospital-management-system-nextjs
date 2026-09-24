"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiGet } from "@/lib/api-client";
import { friendlyError } from "@/lib/patient-ui";

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
  const [loading, setLoading] = useState(true);

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

      if (!cancelled) {
        setContacts(list);
        setLoading(false);
      }
    }

    if (session) load();
    return () => {
      cancelled = true;
    };
  }, [session]);

  return { contacts, loading };
}

function contactName(c: Contact) {
  return c.role === "Doctor" ? `Dr. ${c.name}` : c.name;
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
  const { contacts, loading } = useContacts();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = contacts.filter((c) =>
    `${c.name} ${c.detail}`.toLowerCase().includes(query.toLowerCase()),
  );

  async function handleSend() {
    if (!selected || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      await onCreate(selected.userId, body);
      setSelected(null);
      setBody("");
      setQuery("");
    } catch (err) {
      setError(friendlyError(err, "Your message wasn't sent. Please try again."));
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="New message">
      <div className="flex flex-col gap-4">
        {!selected ? (
          <>
            <TextField
              fieldSize="lg"
              label="Find a doctor or patient"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              autoFocus
            />
            <div className="max-h-64 overflow-y-auto rounded-lg border border-rule">
              {loading ? (
                <div className="space-y-1 p-2" role="status" aria-label="Loading contacts" aria-busy="true">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-3.5 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-500">
                  {query ? "No one matches that search." : "There is no one to message yet."}
                </p>
              ) : (
                <ul>
                  {filtered.map((c) => (
                    <li key={`${c.role}-${c.userId}`} className="border-b border-rule last:border-0">
                      <button
                        type="button"
                        onClick={() => setSelected(c)}
                        className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-paper"
                      >
                        <Avatar name={c.name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink-900">{contactName(c)}</span>
                          {c.detail && <span className="block truncate text-xs text-ink-500">{c.detail}</span>}
                        </span>
                        <span className="shrink-0 text-xs text-ink-500">{c.role}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-lg bg-paper px-3 py-2.5">
              <Avatar name={selected.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink-900">{contactName(selected)}</span>
                {selected.detail && <span className="block truncate text-xs text-ink-500">{selected.detail}</span>}
              </span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-md px-2 py-1.5 text-sm font-medium text-accent-700 transition-colors hover:bg-accent-050"
              >
                Change
              </button>
            </div>
            <TextAreaField
              fieldSize="lg"
              label="Message"
              value={body}
              maxLength={4000}
              onChange={(e) => setBody(e.target.value)}
              autoFocus
            />
            {error && <FormAlert tone="error">{error}</FormAlert>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button loading={sending} disabled={!body.trim()} onClick={handleSend}>
                {sending ? "Sending…" : "Send message"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
