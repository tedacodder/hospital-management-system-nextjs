import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/lib/api";
import { getMedicationById, searchMedications } from "@/lib/medications/service";

// These tests exercise lib/medications/service.ts together with
// lib/integrations/openfda/client.ts (the real HTTP layer) by stubbing
// global.fetch — the actual network call is what we don't want in a test
// suite, not the code that builds and interprets it. See vitest.config.ts's
// comment on why @prisma/client is aliased instead: the same reasoning
// (don't depend on the live network / a generated client) applies here.

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/// `URLSearchParams` encodes spaces as `+`, which `decodeURIComponent` alone
/// does not turn back into a space (it isn't `%20`) — this decodes a
/// requested URL the way a human reading the query would.
function decodeQuery(url: string): string {
  return decodeURIComponent(url.replace(/\+/g, " "));
}

const SAMPLE_LABEL = {
  id: "abc123de-4567-4a89-bcde-f0123456789a",
  set_id: "abc123de-4567-4a89-bcde-f0123456789a",
  openfda: {
    brand_name: ["Advil"],
    generic_name: ["Ibuprofen"],
    manufacturer_name: ["Pfizer Consumer Healthcare"],
    product_ndc: ["0000-000-00"],
    route: ["ORAL"],
    dosage_form: ["TABLET"],
    substance_name: ["IBUPROFEN"],
  },
  active_ingredient: ["Ibuprofen 200 mg"],
  indications_and_usage: ["For the temporary relief of minor aches and pains."],
  warnings: ["Stomach bleeding warning."],
  drug_interactions: ["Do not use with other NSAIDs."],
};

describe("searchMedications", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects a search with no name or manufacturer before making any request", async () => {
    await expect(searchMedications({ page: 1, pageSize: 10 })).rejects.toThrow(HttpError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("builds a sanitized openFDA query and normalizes the result", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { meta: { results: { skip: 0, limit: 10, total: 1 } }, results: [SAMPLE_LABEL] }),
    );

    const { items, total } = await searchMedications({ q: "ibuprofentest1", page: 1, pageSize: 10 });

    expect(total).toBe(1);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "abc123de-4567-4a89-bcde-f0123456789a",
      brandName: "Advil",
      genericName: "Ibuprofen",
      manufacturer: "Pfizer Consumer Healthcare",
    });

    const requestedUrl = fetchMock.mock.calls[0][0] as string;
    expect(requestedUrl).toContain("/drug/label.json");
    expect(requestedUrl).toContain("skip=0");
    expect(requestedUrl).toContain("limit=10");
    // The term is present, wildcarded for prefix matching, and OR'd across
    // the three name fields.
    expect(decodeQuery(requestedUrl)).toContain("openfda.brand_name:ibuprofentest1*");
    expect(decodeQuery(requestedUrl)).toContain(" OR ");
  });

  it("strips characters that could break out of the query syntax instead of passing them through", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(404, { error: { code: "NOT_FOUND" } }));

    // A user pasting this is attempting to close the quoted phrase our code
    // wraps their term in and inject an independent, unrestricted wildcard
    // clause of their own.
    await searchMedications({ q: 'ibuprofen") OR openfda.brand_name:*', page: 1, pageSize: 10 });

    const requestedUrl = decodeQuery(fetchMock.mock.calls[0][0] as string);

    // The dangerous characters (", ), :, *) never reach the query — every
    // quote present in the final search expression is one our own code
    // added (two per OR'd field: three fields = six), never one supplied by
    // the user, so there's nothing left for user input to "close".
    expect((requestedUrl.match(/"/g) ?? []).length).toBe(6);
    // In particular, the attacker's own bare wildcard clause never appears.
    expect(requestedUrl).not.toMatch(/openfda\.brand_name:\*(?!")/);
  });

  it("treats openFDA's 404 'no matches' response as an empty result, not an error", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(404, { error: { code: "NOT_FOUND", message: "No matches found!" } }));

    const { items, total } = await searchMedications({ q: "zzzznotarealdrug", page: 1, pageSize: 10 });
    expect(items).toEqual([]);
    expect(total).toBe(0);
  });

  it("maps a 429 from openFDA to a 429 HttpError", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(429, { error: { code: "RATE_LIMIT" } }));

    await expect(searchMedications({ q: "ibuprofentest429", page: 1, pageSize: 10 })).rejects.toMatchObject({
      status: 429,
    });
  });

  it("maps a 5xx from openFDA to a safe 502 HttpError", async () => {
    fetchMock.mockResolvedValueOnce(new Response("internal error", { status: 503 }));

    await expect(searchMedications({ q: "ibuprofentest503", page: 1, pageSize: 10 })).rejects.toMatchObject({
      status: 502,
    });
  });

  it("maps a network failure to a 502 HttpError", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    await expect(searchMedications({ q: "ibuprofentestnet", page: 1, pageSize: 10 })).rejects.toMatchObject({
      status: 502,
    });
  });

  it("paginates using skip derived from page and pageSize", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { meta: { results: { skip: 20, limit: 10, total: 0 } }, results: [] }));

    await searchMedications({ q: "ibuprofentestpage", page: 3, pageSize: 10 });

    const requestedUrl = fetchMock.mock.calls[0][0] as string;
    expect(requestedUrl).toContain("skip=20");
  });
});

describe("getMedicationById", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects an id containing characters outside the safe set, without making a request", async () => {
    await expect(getMedicationById('abc"); DROP TABLE')).rejects.toThrow(HttpError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a fully normalized detail record, including label sections and the DailyMed link", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { meta: { results: { skip: 0, limit: 1, total: 1 } }, results: [SAMPLE_LABEL] }),
    );

    const detail = await getMedicationById("abc123de-4567-4a89-bcde-f0123456789a");

    expect(detail).not.toBeNull();
    expect(detail?.brandName).toBe("Advil");
    expect(detail?.indicationsAndUsage).toContain("temporary relief");
    expect(detail?.warnings).toContain("Stomach bleeding");
    expect(detail?.labelReferenceUrl).toBe(
      "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=abc123de-4567-4a89-bcde-f0123456789a",
    );
  });

  it("returns null when openFDA has no record for that id", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(404, { error: { code: "NOT_FOUND" } }));

    const detail = await getMedicationById("00000000-0000-0000-0000-000000000000");
    expect(detail).toBeNull();
  });
});
