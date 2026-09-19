"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, LoadingRows } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { apiGet, apiSend, ApiError } from "@/lib/api-client";

type Department = { id: number; name: string; description: string | null; _count: { doctors: number } };

export default function AdminDepartmentsClient() {
  const { status } = useSession();
  const router = useRouter();
  const { push } = useToast();

  const [rows, setRows] = useState<Department[] | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  function load() {
    apiGet<Department[]>("/departments").then(setRows).catch(() => setRows([]));
  }

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status]);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await apiSend("POST", "/departments", { name, description: description || undefined });
      setName("");
      setDescription("");
      push(`${name} added.`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create the department.");
    } finally {
      setSaving(false);
    }
  }

  if (status !== "authenticated") return null;

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink-900">Departments</h1>

      <Card className="mt-4 max-w-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex-1">
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button loading={saving} disabled={!name.trim()} onClick={handleCreate}>
            Add
          </Button>
        </div>
        {error && (
          <p className="mt-3 rounded-md bg-[var(--color-signal-stop-bg)] px-3 py-2 text-sm text-[var(--color-signal-stop)]">
            {error}
          </p>
        )}
      </Card>

      <div className="mt-5">
        {rows === null ? (
          <LoadingRows rows={4} />
        ) : rows.length === 0 ? (
          <EmptyState title="No departments yet" body="Add your first department above." />
        ) : (
          <Card padded={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-rule bg-paper text-xs text-ink-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Description</th>
                    <th className="px-4 py-2.5 font-medium">Doctors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {rows.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3 font-medium text-ink-900">{d.name}</td>
                      <td className="px-4 py-3 text-ink-500">{d.description ?? "—"}</td>
                      <td className="px-4 py-3 text-ink-700">{d._count.doctors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
