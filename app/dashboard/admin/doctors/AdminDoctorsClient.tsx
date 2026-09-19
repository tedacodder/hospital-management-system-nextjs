"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card, EmptyState, LoadingRows } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { apiGetPaged, type ApiMeta } from "@/lib/api-client";

type Doctor = {
  id: number;
  specialization: string;
  yearsExperience: number | null;
  consultationFee: string | null;
  isAcceptingNew: boolean;
  department: { name: string } | null;
  user: { name: string | null; email: string; phone: string };
  _count: { appointments: number };
};

export default function AdminDoctorsClient() {
  const { status } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<Doctor[] | null>(null);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const handle = setTimeout(() => {
      apiGetPaged<Doctor[]>("/doctors", { q: q || undefined, page, pageSize: 20 })
        .then(({ data, meta }) => {
          setRows(data);
          setMeta(meta);
        })
        .catch(() => setRows([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [status, q, page]);

  if (status !== "authenticated") return null;

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink-900">Doctors</h1>
      <p className="mt-1 text-sm text-ink-500">
        To add a doctor, create their account from{" "}
        <a href="/dashboard/admin/users" className="text-accent-700 hover:underline">
          Users
        </a>{" "}
        with role Doctor.
      </p>

      <div className="mt-4 max-w-sm">
        <TextField
          label="Search"
          placeholder="Name, specialization, or department"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="mt-4">
        {rows === null ? (
          <LoadingRows rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState title="No doctors found" body={q ? "Try a different search." : "No doctors are registered yet."} />
        ) : (
          <Card padded={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-rule bg-paper text-xs text-ink-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Specialization</th>
                    <th className="px-4 py-2.5 font-medium">Department</th>
                    <th className="px-4 py-2.5 font-medium">Contact</th>
                    <th className="px-4 py-2.5 font-medium">Appointments</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {rows.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3 text-ink-900">Dr. {d.user.name}</td>
                      <td className="px-4 py-3 text-ink-700">{d.specialization}</td>
                      <td className="px-4 py-3 text-ink-700">{d.department?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-ink-500">
                        <div>{d.user.email}</div>
                        <div>{d.user.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-700">{d._count.appointments}</td>
                      <td className="px-4 py-3">
                        <Badge tone={d.isAcceptingNew ? "ok" : "neutral"}>
                          {d.isAcceptingNew ? "Accepting patients" : "Not accepting"}
                        </Badge>
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
    </AppShell>
  );
}
