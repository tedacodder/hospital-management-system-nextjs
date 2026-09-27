"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, EmptyState, ErrorState, LoadingRows } from "@/components/ui/Card";
import { PillIcon } from "@/components/ui/Icons";
import { Pagination } from "@/components/ui/Pagination";
import { TextField } from "@/components/ui/Field";
import type { ApiMeta } from "@/lib/api-client";
import { apiGetPaged, ApiError } from "@/lib/api-client";
import { SourceNotice } from "./SourceNotice";
import { medicationLabel, type MedicationSummary } from "./types";

const PAGE_SIZE = 10;
const MIN_TERM_LENGTH = 2;

function MedicationCard({ medication, href }: { medication: MedicationSummary; href: string }) {
  return (
    <Link href={href}>
      <Card interactive className="flex h-full flex-col gap-2">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-050 text-accent-700">
            <PillIcon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-900">{medicationLabel(medication)}</p>
            {medication.genericName && medication.genericName !== medication.brandName && (
              <p className="truncate text-xs text-ink-500">{medication.genericName}</p>
            )}
          </div>
        </div>
        <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <div>
            <dt className="text-ink-500">Manufacturer</dt>
            <dd className="truncate text-ink-700">{medication.manufacturer ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Form / route</dt>
            <dd className="truncate text-ink-700">
              {[medication.dosageForm, medication.route].filter(Boolean).join(" · ") || "—"}
            </dd>
          </div>
          {medication.ndc[0] && (
            <div className="col-span-2">
              <dt className="text-ink-500">NDC</dt>
              <dd className="font-mono text-ink-700">{medication.ndc[0]}</dd>
            </div>
          )}
        </dl>
      </Card>
    </Link>
  );
}

/// The Medication & Drug Information Center's search screen. `basePath` is
/// the caller's dashboard root (e.g. "/dashboard/doc/medications") so the
/// same component works unchanged under the doctor, admin, and patient
/// dashboards — only the wrapping page.tsx differs, by role guard.
export function MedicationSearch({ basePath }: { basePath: string }) {
  const [q, setQ] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [debounced, setDebounced] = useState({ q: "", manufacturer: "" });
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<MedicationSummary[] | null>(null);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setDebounced({ q: q.trim(), manufacturer: manufacturer.trim() }), 350);
    return () => clearTimeout(id);
  }, [q, manufacturer]);

  useEffect(() => {
    setPage(1);
  }, [debounced.q, debounced.manufacturer]);

  const hasEnoughInput = debounced.q.length >= MIN_TERM_LENGTH || debounced.manufacturer.length >= MIN_TERM_LENGTH;

  useEffect(() => {
    if (!hasEnoughInput) {
      setRows(null);
      setErrorMessage(null);
      return;
    }
    setRows(null);
    setErrorMessage(null);
    apiGetPaged<MedicationSummary[]>("/medications", {
      q: debounced.q || undefined,
      manufacturer: debounced.manufacturer || undefined,
      page,
      pageSize: PAGE_SIZE,
    })
      .then(({ data, meta }) => {
        setRows(data);
        setMeta(meta);
      })
      .catch((err) => {
        setErrorMessage(err instanceof ApiError ? err.message : "We couldn't reach the medication reference service.");
      });
  }, [hasEnoughInput, debounced.q, debounced.manufacturer, page, reloadKey]);

  return (
    <div className="flex flex-col gap-5">
      <SourceNotice />

      <div className="grid gap-3 sm:max-w-xl sm:grid-cols-2">
        <TextField
          label="Medication or ingredient"
          placeholder="e.g. ibuprofen, amoxicillin"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={120}
        />
        <TextField
          label="Manufacturer"
          optional
          placeholder="e.g. Pfizer"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          maxLength={120}
        />
      </div>

      {!hasEnoughInput ? (
        <EmptyState
          icon={<PillIcon />}
          title="Search the medication reference"
          body="Enter a brand name, generic name, active ingredient, or manufacturer (2+ characters) to search real FDA drug labeling."
        />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : rows === null ? (
        <LoadingRows rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<PillIcon />}
          title="No medications match that search"
          body="Try a different name, ingredient, or manufacturer. openFDA covers U.S.-labeled products only."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((m) => (
              <MedicationCard key={m.id} medication={m} href={`${basePath}/${encodeURIComponent(m.id)}`} />
            ))}
          </div>
          <Card padded={false}>
            <Pagination meta={meta} onPageChange={setPage} />
          </Card>
        </>
      )}
    </div>
  );
}
