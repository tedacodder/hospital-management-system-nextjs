"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/patient/PageHeader";
import { PatientDirectory } from "@/components/doctor/PatientDirectory";

export default function PatientsClient() {
  return (
    <AppShell>
      <PageHeader
        title="Patients"
        description="Search the full patient directory. Opening a chart is limited to patients you're treating."
      />
      <PatientDirectory />
    </AppShell>
  );
}
