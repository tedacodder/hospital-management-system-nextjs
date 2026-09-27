import { HttpError } from "@/lib/api";
import { fetchDrugLabels } from "@/lib/integrations/openfda/client";
import type { OpenFdaLabelResult } from "@/lib/integrations/openfda/types";

// SECURITY: nothing in this file, or in lib/integrations/openfda/client.ts,
// ever receives patient data. Every function here takes only the doctor's
// typed search term (or an opaque openFDA label id) and returns public FDA
// labeling data — no patient name, MRN, diagnosis, or prescription content is
// ever included in a request to openFDA. Keep it that way: this module must
// never import from lib/auth.ts's patient-facing helpers or accept a
// patient/prescription object as a parameter.

export type MedicationSummary = {
  /// openFDA's SPL "set id" for this label — used as the id in this app's
  /// own /api/medications/:id route and as the DailyMed cross-reference.
  id: string;
  brandName: string | null;
  genericName: string | null;
  manufacturer: string | null;
  dosageForm: string | null;
  route: string | null;
  substanceNames: string[];
  ndc: string[];
};

export type MedicationDetail = MedicationSummary & {
  activeIngredient: string | null;
  description: string | null;
  indicationsAndUsage: string | null;
  dosageAndAdministration: string | null;
  contraindications: string | null;
  warnings: string | null;
  adverseReactions: string | null;
  drugInteractions: string | null;
  pregnancy: string | null;
  storageAndHandling: string | null;
  /// DailyMed (part of the U.S. National Library of Medicine) republishes the
  /// same Structured Product Labeling document under the same set id, and is
  /// the standard human-readable reference for it — openFDA itself has no
  /// per-label web page. Null only if openFDA returned no id at all.
  labelReferenceUrl: string | null;
};

function first(arr?: string[]): string | null {
  return arr && arr.length > 0 ? arr[0] : null;
}

function joinText(...groups: Array<string[] | undefined>): string | null {
  for (const arr of groups) {
    if (arr && arr.length > 0) return arr.join("\n\n");
  }
  return null;
}

function toSummary(r: OpenFdaLabelResult): MedicationSummary | null {
  const id = r.id ?? r.set_id;
  // Skip any record openFDA returns without a stable identifier — with
  // nothing to link a detail page to, it would be a dead end in the UI.
  if (!id) return null;
  return {
    id,
    brandName: first(r.openfda?.brand_name),
    genericName: first(r.openfda?.generic_name),
    manufacturer: first(r.openfda?.manufacturer_name),
    dosageForm: first(r.openfda?.dosage_form),
    route: first(r.openfda?.route),
    substanceNames: r.openfda?.substance_name ?? [],
    ndc: r.openfda?.product_ndc ?? [],
  };
}

function toDetail(r: OpenFdaLabelResult): MedicationDetail | null {
  const summary = toSummary(r);
  if (!summary) return null;
  const setId = r.set_id ?? r.id;
  return {
    ...summary,
    activeIngredient: joinText(r.active_ingredient),
    description: joinText(r.description),
    indicationsAndUsage: joinText(r.indications_and_usage),
    dosageAndAdministration: joinText(r.dosage_and_administration),
    contraindications: joinText(r.contraindications),
    warnings: joinText(r.warnings, r.warnings_and_cautions),
    adverseReactions: joinText(r.adverse_reactions),
    drugInteractions: joinText(r.drug_interactions),
    pregnancy: joinText(r.pregnancy),
    storageAndHandling: joinText(r.storage_and_handling),
    labelReferenceUrl: setId ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${encodeURIComponent(setId)}` : null,
  };
}

// ── Query building ──
//
// openFDA's `search` parameter is a Lucene-style expression. These helpers
// build one from user input safely: rather than escaping quotes/parens (easy
// to get subtly wrong), disallowed characters are simply stripped, and the
// term is capped in length. A single-word term becomes a prefix wildcard
// (`ibuprofen*`) so partial typing still matches; a multi-word term is
// matched as an exact phrase, since wildcards and quoted phrases can't be
// combined in one clause.

const MAX_TERM_LENGTH = 120;

function sanitizeTerm(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9\s\-'.]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_TERM_LENGTH);
}

function fieldClause(field: string, rawTerm: string): string | null {
  const safe = sanitizeTerm(rawTerm);
  if (!safe) return null;
  return /\s/.test(safe) ? `${field}:"${safe}"` : `${field}:${safe}*`;
}

const NAME_FIELDS = ["openfda.brand_name", "openfda.generic_name", "openfda.substance_name"];

function buildSearch(params: { q?: string; manufacturer?: string }): string {
  const clauses: string[] = [];

  if (params.q) {
    const safe = sanitizeTerm(params.q);
    if (safe) {
      const nameClauses = NAME_FIELDS.map((f) => (/\s/.test(safe) ? `${f}:"${safe}"` : `${f}:${safe}*`));
      clauses.push(`(${nameClauses.join(" OR ")})`);
    }
  }

  if (params.manufacturer) {
    const clause = fieldClause("openfda.manufacturer_name", params.manufacturer);
    if (clause) clauses.push(clause);
  }

  return clauses.join(" AND ");
}

// ── Public API ──

export async function searchMedications(params: {
  q?: string;
  manufacturer?: string;
  page: number;
  pageSize: number;
}): Promise<{ items: MedicationSummary[]; total: number }> {
  const search = buildSearch(params);
  if (!search) {
    throw new HttpError(400, "Enter a medication name, ingredient, or manufacturer to search");
  }

  const skip = (params.page - 1) * params.pageSize;
  const res = await fetchDrugLabels({ search, skip, limit: params.pageSize });

  const items = res.results.map(toSummary).filter((m): m is MedicationSummary => m !== null);
  return { items, total: res.meta?.results?.total ?? items.length };
}

/// openFDA set ids are lowercase-hex UUIDs in practice, but the exact shape
/// isn't part of any documented contract — this only guards against the id
/// being used to inject anything into the Lucene query string below.
const SAFE_ID = /^[a-zA-Z0-9-]{1,64}$/;

export async function getMedicationById(id: string): Promise<MedicationDetail | null> {
  if (!SAFE_ID.test(id)) {
    throw new HttpError(400, "Invalid medication reference");
  }

  const res = await fetchDrugLabels({ search: `id:"${id}"`, skip: 0, limit: 1 });
  const raw = res.results[0];
  return raw ? toDetail(raw) : null;
}
