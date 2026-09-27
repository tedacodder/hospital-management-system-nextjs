"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, ErrorState, LoadingRows } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  AlertIcon,
  ArrowLeftIcon,
  ClipboardIcon,
  ExternalLinkIcon,
  PillIcon,
  ShieldIcon,
} from "@/components/ui/Icons";
import { apiGet, ApiError } from "@/lib/api-client";
import { SourceNotice } from "./SourceNotice";
import { medicationLabel, type MedicationDetail } from "./types";
import { PrescribeMedicationDialog } from "./PrescribeMedicationDialog";

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink-900">{value || "—"}</dd>
    </div>
  );
}

/// One official-label section. Body text comes straight from the FDA
/// Structured Product Labeling document — it is shown verbatim (with line
/// breaks preserved) and never summarized or rewritten, so nothing here can
/// drift from what the label actually says. Sections openFDA didn't return
/// for this product are omitted entirely rather than shown as "Not provided",
/// since a long list of empty sections would bury the ones that matter.
function LabelSection({ title, icon, body, tone }: { title: string; icon: React.ReactNode; body: string | null; tone?: "stop" }) {
  if (!body) return null;
  return (
    <Card
      className={tone === "stop" ? "border-[var(--color-signal-stop)]/25 bg-[var(--color-signal-stop-bg)]/40" : undefined}
    >
      <h3
        className={`mb-3 flex items-center gap-2 text-sm font-semibold ${
          tone === "stop" ? "text-[var(--color-signal-stop)]" : "text-ink-900"
        }`}
      >
        {icon}
        {title}
      </h3>
      <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{body}</p>
    </Card>
  );
}

/// The Medication & Drug Information Center's detail screen. `basePath` is
/// the caller's dashboard root, used only for the back link; `canPrescribe`
/// gates the one action this screen can trigger (opening the patient picker)
/// so a patient or admin viewing the same reference sees a read-only page.
export function MedicationDetailClient({ basePath, canPrescribe }: { basePath: string; canPrescribe: boolean }) {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [medication, setMedication] = useState<MedicationDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setMedication(null);
    setErrorMessage(null);
    apiGet<MedicationDetail>(`/medications/${encodeURIComponent(params.id)}`)
      .then(setMedication)
      .catch((err) =>
        setErrorMessage(err instanceof ApiError ? err.message : "We couldn't load this medication's labeling."),
      );
  }, [params.id]);

  const backLink = (
    <Link href={basePath} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-700 hover:text-accent-700">
      <ArrowLeftIcon className="h-4 w-4" />
      Back to medication search
    </Link>
  );

  if (errorMessage) {
    return (
      <>
        {backLink}
        <ErrorState message={errorMessage} />
      </>
    );
  }

  if (!medication) {
    return (
      <>
        {backLink}
        <LoadingRows rows={5} />
      </>
    );
  }

  const label = medicationLabel(medication);
  // Only a doctor's own session may reference a medication into a
  // prescription — enforced again server-side when the prescription is
  // actually saved, but hidden here too so the action is never even offered
  // to a role that can't use it.
  const showPrescribeAction = canPrescribe && session?.user?.role === "DOCTOR";

  return (
    <>
      {backLink}

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.025em] text-ink-900 sm:text-[1.75rem]">{label}</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            {medication.genericName && medication.genericName !== medication.brandName && `${medication.genericName} · `}
            {medication.manufacturer ?? "Manufacturer not listed"}
          </p>
        </div>
        {showPrescribeAction && (
          <Button onClick={() => setDialogOpen(true)}>
            <PillIcon className="h-4 w-4" />
            Reference in prescription
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <SourceNotice />

        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-900">
            <ClipboardIcon className="h-4 w-4 text-ink-500" />
            Overview
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <InfoRow label="Brand name" value={medication.brandName} />
            <InfoRow label="Generic name" value={medication.genericName} />
            <InfoRow label="Manufacturer" value={medication.manufacturer} />
            <InfoRow label="Dosage form" value={medication.dosageForm} />
            <InfoRow label="Route" value={medication.route} />
            <InfoRow label="NDC" value={medication.ndc[0] ?? null} />
            {medication.substanceNames.length > 0 && (
              <div className="col-span-2 sm:col-span-3">
                <InfoRow label="Active substance(s)" value={medication.substanceNames.join(", ")} />
              </div>
            )}
          </dl>
        </Card>

        <LabelSection title="Indications and usage" icon={<ClipboardIcon className="h-4 w-4 text-ink-500" />} body={medication.indicationsAndUsage} />
        <LabelSection title="Active ingredient" icon={<PillIcon className="h-4 w-4 text-ink-500" />} body={medication.activeIngredient} />
        <LabelSection title="Dosage and administration" icon={<ClipboardIcon className="h-4 w-4 text-ink-500" />} body={medication.dosageAndAdministration} />
        <LabelSection title="Contraindications" icon={<AlertIcon className="h-4 w-4" />} body={medication.contraindications} tone="stop" />
        <LabelSection title="Warnings and precautions" icon={<AlertIcon className="h-4 w-4" />} body={medication.warnings} tone="stop" />
        <LabelSection title="Adverse reactions" icon={<AlertIcon className="h-4 w-4" />} body={medication.adverseReactions} tone="stop" />
        <LabelSection title="Drug interactions" icon={<AlertIcon className="h-4 w-4" />} body={medication.drugInteractions} tone="stop" />
        <LabelSection title="Pregnancy" icon={<ShieldIcon className="h-4 w-4 text-ink-500" />} body={medication.pregnancy} />
        <LabelSection title="Storage and handling" icon={<ClipboardIcon className="h-4 w-4 text-ink-500" />} body={medication.storageAndHandling} />
        <LabelSection title="Description" icon={<ClipboardIcon className="h-4 w-4 text-ink-500" />} body={medication.description} />

        {!medication.indicationsAndUsage &&
          !medication.contraindications &&
          !medication.warnings &&
          !medication.adverseReactions &&
          !medication.drugInteractions && (
            <p className="text-sm text-ink-500">
              openFDA did not return detailed labeling sections for this product beyond the overview above. This is a
              limitation of the source data, not of this page — see the official label for the complete text.
            </p>
          )}

        {medication.labelReferenceUrl && (
          <a
            href={medication.labelReferenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent-700 hover:underline"
          >
            View the complete official label on DailyMed
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {showPrescribeAction && (
        <PrescribeMedicationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} medicationName={label} />
      )}
    </>
  );
}
