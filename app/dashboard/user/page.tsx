import { Role } from "@prisma/client";
import { requirePageSession } from "@/lib/auth";
import PatientDashboardClient from "./PatientDashboardClient";

// Staff and admin may also view this dashboard (e.g. to see what a patient
// sees while assisting them at the front desk); doctors may not.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string }>;
}) {
  await requirePageSession(Role.PATIENT, Role.ADMIN, Role.STAFF);
  const { paid } = await searchParams;
  return <PatientDashboardClient paidInvoiceNumber={paid} />;
}
