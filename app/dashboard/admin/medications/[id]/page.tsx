import { Role } from "@prisma/client";
import { requirePageSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { MedicationDetailClient } from "@/components/medications/MedicationDetailClient";

export default async function Page() {
  await requirePageSession(Role.ADMIN, Role.STAFF);
  return (
    <AppShell>
      <MedicationDetailClient basePath="/dashboard/admin/medications" canPrescribe={false} />
    </AppShell>
  );
}
