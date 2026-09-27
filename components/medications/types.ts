// Shapes of the responses the medication screens read. These describe what
// app/api/medications/* already returns; nothing here asks the backend for
// anything new. See lib/medications/service.ts for how they're built from
// openFDA's raw label data.

export type MedicationSummary = {
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
  labelReferenceUrl: string | null;
};

/// A short, human-friendly label for a medication, used as the UI's primary
/// heading and as the seed value handed to the prescription workflow.
export function medicationLabel(m: MedicationSummary): string {
  return m.brandName || m.genericName || "Unnamed medication";
}
