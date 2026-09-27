import { Role } from "@prisma/client";
import { requirePageSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/patient/PageHeader";
import { MedicationSearch } from "@/components/medications/MedicationSearch";

export default async function Page() {
  // Staff and admin may also view this screen (e.g. to look something up
  // while assisting a patient at the front desk), matching the pattern
  // already used for the rest of the patient dashboard.
  await requirePageSession(Role.PATIENT, Role.ADMIN, Role.STAFF);
  return (
    <AppShell>
      <PageHeader
        title="Medication information"
        description="Look up FDA drug labeling for medications you've been prescribed or are curious about."
      />
      <MedicationSearch basePath="/dashboard/user/medications" />
    </AppShell>
  );
}
