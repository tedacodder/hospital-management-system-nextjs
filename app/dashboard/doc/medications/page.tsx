import { Role } from "@prisma/client";
import { requirePageSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/patient/PageHeader";
import { MedicationSearch } from "@/components/medications/MedicationSearch";

export default async function Page() {
  await requirePageSession(Role.DOCTOR, Role.ADMIN, Role.STAFF);
  return (
    <AppShell>
      <PageHeader
        title="Medication & Drug Information Center"
        description="Search real FDA drug labeling to check indications, dosing, and safety information, and reference a medication in a patient's prescription."
      />
      <MedicationSearch basePath="/dashboard/doc/medications" />
    </AppShell>
  );
}
