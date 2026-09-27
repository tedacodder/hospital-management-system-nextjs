// Shapes returned by the openFDA Drug Label API (https://api.fda.gov/drug/label.json).
// This is the raw wire format — see https://open.fda.gov/apis/drug/label/searchable-fields/
// for the full field list. Only the fields this application reads are typed;
// every field is optional because label completeness varies enormously by
// product (an OTC monograph drug and a full prescription insert do not carry
// the same sections).

export interface OpenFdaAnnotations {
  brand_name?: string[];
  generic_name?: string[];
  manufacturer_name?: string[];
  product_ndc?: string[];
  route?: string[];
  dosage_form?: string[];
  substance_name?: string[];
  pharm_class_epc?: string[];
}

export interface OpenFdaLabelResult {
  /// The SPL "set id" — a stable identifier for this labeling document,
  /// shared with DailyMed. Not every historical record carries `id` as a
  /// top-level field, but `set_id` is present on effectively all of them.
  id?: string;
  set_id?: string;
  openfda?: OpenFdaAnnotations;
  active_ingredient?: string[];
  description?: string[];
  indications_and_usage?: string[];
  dosage_and_administration?: string[];
  contraindications?: string[];
  warnings?: string[];
  warnings_and_cautions?: string[];
  adverse_reactions?: string[];
  drug_interactions?: string[];
  pregnancy?: string[];
  storage_and_handling?: string[];
}

export interface OpenFdaLabelResponse {
  meta?: {
    results?: { skip: number; limit: number; total: number };
  };
  results: OpenFdaLabelResult[];
}
