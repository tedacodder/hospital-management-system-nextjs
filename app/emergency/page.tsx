import { prisma } from "@/lib/prisma";

export const metadata = { title: "Emergency information" };

// This page is informational only. It displays contact details and does not
// contact emergency services on the visitor's behalf — the product brief is
// explicit that this application must never imply automatic dispatch it
// doesn&apos;t have.

export default async function EmergencyPage() {
  const settings = await prisma.hospitalSettings.findUnique({ where: { id: 1 } });
  const emergencyPhone = settings?.emergencyPhone || null;
  const mainPhone = settings?.phone || null;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <div className="rounded-lg border border-[var(--color-signal-stop)]/25 bg-[var(--color-signal-stop-bg)] p-5">
        <p className="text-sm font-semibold text-[var(--color-signal-stop)]">
          If this is a life-threatening emergency, call your local emergency
          number now.
        </p>
        <p className="mt-1 text-sm text-[var(--color-signal-stop)]">
          This page does not contact emergency services. It shows how to reach
          this hospital directly.
        </p>
      </div>

      <h1 className="mt-8 text-xl font-semibold text-ink-900">Emergency department contact</h1>

      <dl className="mt-4 divide-y divide-rule rounded-lg border border-rule bg-surface">
        <Row label="Emergency line" value={emergencyPhone ?? "Not configured yet"} />
        <Row label="Main hospital line" value={mainPhone ?? "Not configured yet"} />
        <Row label="Address" value={settings?.addressLine || "Not configured yet"} />
      </dl>

      <h2 className="mt-8 text-sm font-semibold text-ink-900">Before you arrive</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-700">
        <li>Bring a photo ID and, if you have one, your patient ID card.</li>
        <li>Bring a list of current medications, or the medications themselves.</li>
        <li>If possible, have someone else drive — don&apos;t drive yourself if you&apos;re unwell.</li>
        <li>Note the time symptoms started; you&apos;ll be asked at triage.</li>
      </ul>

      {!emergencyPhone && (
        <p className="mt-8 text-xs text-ink-500">
          An administrator hasn&apos;t set the emergency contact number yet. Go to
          Hospital Settings to add one.
        </p>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="font-mono text-sm font-medium text-ink-900">{value}</dd>
    </div>
  );
}
