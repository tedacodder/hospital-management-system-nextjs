"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card, EmptyState, ErrorState, LoadingRows } from "@/components/ui/Card";
import { SearchIcon, UsersIcon } from "@/components/ui/Icons";
import { Pagination } from "@/components/ui/Pagination";
import type { ApiMeta } from "@/lib/api-client";
import { apiGetPaged } from "@/lib/api-client";
import type { PatientRow } from "@/components/doctor/types";

const PAGE_SIZE = 20;

/// A directory of every patient in the system (the same list front-desk staff
/// see) — not just "your" patients. A doctor may open any row to search for
/// someone, but the chart itself only opens for a patient they've actually
/// treated; see the note on the detail page for why that split is safe.
export function PatientDirectory() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PatientRow[] | null>(null);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);

  useEffect(() => {
    setRows(null);
    setError(false);
    apiGetPaged<PatientRow[]>("/patients", { page, pageSize: PAGE_SIZE, q: debouncedQ || undefined })
      .then(({ data, meta }) => {
        setRows(data);
        setMeta(meta);
      })
      .catch(() => setError(true));
  }, [page, debouncedQ, reloadKey]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, MRN, email or phone"
          aria-label="Search patients"
          className="h-10 w-full rounded-md border border-rule-strong bg-white pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-500 focus-visible:border-accent-600"
        />
      </div>

      {error ? (
        <ErrorState message="We couldn't load the patient directory." onRetry={() => setReloadKey((k) => k + 1)} />
      ) : rows === null ? (
        <LoadingRows rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title={debouncedQ ? "No patients match that search" : "No patients yet"}
          body={debouncedQ ? "Try a different name, MRN, email or phone number." : "Registered patients will appear here."}
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-rule bg-paper text-xs text-ink-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Patient</th>
                  <th className="px-4 py-2.5 font-medium">MRN</th>
                  <th className="px-4 py-2.5 font-medium">Contact</th>
                  <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Blood type</th>
                  <th className="px-4 py-2.5 font-medium">Visits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {rows.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-paper">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/doc/patients/${p.id}`} className="flex items-center gap-2.5">
                        <Avatar name={p.user.name} size="sm" />
                        <span className="truncate font-medium text-ink-900">{p.user.name ?? "Unnamed patient"}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-500">{p.mrn ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-500">{p.user.phone || p.user.email}</td>
                    <td className="hidden px-4 py-3 text-ink-700 sm:table-cell">{p.bloodType ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-ink-700">{p._count.appointments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
}
