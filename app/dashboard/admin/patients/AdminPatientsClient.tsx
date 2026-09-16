"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { Card, EmptyState, LoadingRows } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Field";
import { apiGet } from "@/lib/api-client";

type Patient = {
  id: number;
  mrn: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  createdAt: string;
  user: { name: string | null; email: string; phone: string; gender: string; age: string };
  _count: { appointments: number };
};

type Meta = { page: number; pageSize: number; total: number; totalPages: number };

export default function AdminPatientsClient() {
  const { status } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<Patient[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [docsFor, setDocsFor] = useState<Patient | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const handle = setTimeout(() => {
      apiGet<Patient[]>("/patients", { q: q || undefined, page, pageSize: 20 })
        .then((data) => {
          setRows(data);
        })
        .catch(() => setRows([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [status, q, page]);

  if (status !== "authenticated") return null;

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">Patients</h1>
      </div>

      <div className="mt-4 max-w-sm">
        <TextField
          label="Search"
          placeholder="Name, email, phone, or MRN"
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
          <EmptyState title="No patients found" body={q ? "Try a different search." : "No patients are registered yet."} />
        ) : (
          <Card padded={false} className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-rule bg-paper text-xs text-ink-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">MRN</th>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Contact</th>
                  <th className="px-4 py-2.5 font-medium">Age / Gender</th>
                  <th className="px-4 py-2.5 font-medium">Visits</th>
                  <th className="px-4 py-2.5 font-medium">Registered</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-ink-900">{p.mrn}</td>
                    <td className="px-4 py-3 text-ink-900">{p.user.name}</td>
                    <td className="px-4 py-3 text-ink-500">
                      <div>{p.user.email}</div>
                      <div>{p.user.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-700">
                      {p.user.age || "—"} {p.user.gender && `· ${p.user.gender}`}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{p._count.appointments}</td>
                    <td className="px-4 py-3 text-ink-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDocsFor(p)}
                        className="text-xs font-medium text-accent-700 hover:underline"
                      >
                        Documents
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {docsFor && (
        <Dialog open onClose={() => setDocsFor(null)} title={`Documents — ${docsFor.user.name}`}>
          <DocumentsPanel patientId={docsFor.id} canManageAny />
        </Dialog>
      )}
    </AppShell>
  );
}
