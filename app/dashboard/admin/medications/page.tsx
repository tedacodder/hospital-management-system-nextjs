import { Role } from "@prisma/client";
import { requirePageSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/patient/PageHeader";
import { MedicationSearch } from "@/components/medications/MedicationSearch";

export default async function Page() {
  await requirePageSession(Role.ADMIN, Role.STAFF);
  return (
    <AppShell>
      <PageHeader
        title="Medication & Drug Information Center"
        description="Search real FDA drug labeling for indications, dosing, and safety information. Prescribing itself remains a doctor-only action."
      />
      <MedicationSearch basePath="/dashboard/admin/medications" />
    </AppShell>
  );
}
