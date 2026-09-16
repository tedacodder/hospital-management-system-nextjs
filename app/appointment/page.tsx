import { Role } from "@prisma/client";
import { requirePageSession } from "@/lib/auth";
import AppointmentPageClient from "./AppointmentPageClient";

// Doctors cannot book appointments for themselves — see the API rule in
// POST /api/appointments — so this page is not part of their role's nav
// and is gated out here too.
export default async function Page() {
  await requirePageSession(Role.PATIENT, Role.ADMIN, Role.STAFF);
  return <AppointmentPageClient />;
}
