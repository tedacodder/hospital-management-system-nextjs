"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, LoadingRows } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { SelectField, TextField } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { apiGet, apiGetPaged, apiSend, ApiError, type ApiMeta } from "@/lib/api-client";

type UserRow = {
  id: number;
  name: string | null;
  email: string;
  role: "PATIENT" | "DOCTOR" | "STAFF" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

type Department = { id: number; name: string };

const ROLE_TONE = { ADMIN: "stop", STAFF: "info", DOCTOR: "ok", PATIENT: "neutral" } as const;

export default function AdminUsersClient() {
  const { status } = useSession();
  const router = useRouter();
  const { push } = useToast();

  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorFields, setErrorFields] = useState<Record<string, string[]>>({});

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF" as UserRow["role"],
    specialization: "",
    departmentId: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  function load() {
    apiGetPaged<UserRow[]>("/users", { page, pageSize: 20 })
      .then(({ data, meta }) => {
        setRows(data);
        setMeta(meta);
      })
      .catch(() => setRows([]));
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    load();
  }, [status, page]);

  useEffect(() => {
    if (status !== "authenticated") return;
    apiGet<Department[]>("/departments").then(setDepartments).catch(() => {});
  }, [status]);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    setErrorFields({});
    try {
      await apiSend("POST", "/users", {
        ...form,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
      });
      push(`Account created for ${form.name}.`);
      setFormOpen(false);
      setForm({ name: "", email: "", password: "", role: "STAFF", specialization: "", departmentId: "" });
      load();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorFields(err.fields ?? {});
        if (!err.fields) setError(err.message);
      } else {
        setError("Couldn't create the account.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (status !== "authenticated") return null;

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Users</h1>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          New account
        </Button>
      </div>
      <p className="mt-1 text-sm text-ink-500">
        This is the only place a Doctor, Staff, or Admin account can be created — public signup always
        creates a Patient.
      </p>

      <div className="mt-4">
        {rows === null ? (
          <LoadingRows rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <Card padded={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-rule bg-paper text-xs text-ink-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Email</th>
                    <th className="px-4 py-2.5 font-medium">Role</th>
                    <th className="px-4 py-2.5 font-medium">Last sign-in</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {rows.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3 text-ink-900">{u.name}</td>
                      <td className="px-4 py-3 text-ink-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-500">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.isActive ? "ok" : "neutral"}>{u.isActive ? "Active" : "Disabled"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPageChange={setPage} />
          </Card>
        )}
      </div>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} title="Create account">
        <div className="flex flex-col gap-4">
          <TextField
            label="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errorFields.name?.[0]}
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errorFields.email?.[0]}
          />
          <TextField
            label="Temporary password"
            type="text"
            hint="At least 10 characters, with upper, lower and a number. Share this with the person directly."
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errorFields.password?.[0]}
          />
          <SelectField label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRow["role"] })}>
            <option value="STAFF">Staff</option>
            <option value="DOCTOR">Doctor</option>
            <option value="ADMIN">Admin</option>
          </SelectField>

          {form.role === "DOCTOR" && (
            <>
              <TextField
                label="Specialization"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              />
              <SelectField
                label="Department"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </SelectField>
            </>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-md bg-[var(--color-signal-stop-bg)] px-3 py-2 text-sm text-[var(--color-signal-stop)]"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={handleCreate}>
              Create account
            </Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  );
}
