"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/patient/PageHeader";
import { EmptyState } from "@/components/ui/Card";
import { ClockIcon } from "@/components/ui/Icons";
import { apiGet } from "@/lib/api-client";
import { AvailabilityEditor } from "../AvailabilityEditor";

type Stats = { scope: string; doctorId: number | null };

export default function AvailabilityClient() {
  const [doctorId, setDoctorId] = useState<number | null | "loading">("loading");

  useEffect(() => {
    apiGet<Stats>("/dashboard/stats")
      .then((s) => setDoctorId(s.scope === "doctor" ? s.doctorId : null))
      .catch(() => setDoctorId(null));
  }, []);

  return (
    <AppShell>
      <PageHeader title="Availability" description="Set the hours you see patients each week." />

      {doctorId === "loading" ? (
        <div className="flex flex-col gap-2.5" role="status" aria-label="Loading" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : doctorId ? (
        <AvailabilityEditor doctorId={doctorId} />
      ) : (
        <EmptyState
          icon={<ClockIcon />}
          title="No doctor profile on this account"
          body="Availability can only be set for an account with a doctor profile."
        />
      )}
    </AppShell>
  );
}
