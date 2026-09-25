import { Role } from "@prisma/client";
import { requirePageSession } from "@/lib/auth";
import PatientDetailClient from "./PatientDetailClient";

export default async function Page() {
  await requirePageSession(Role.DOCTOR, Role.ADMIN);
  return <PatientDetailClient />;
}
