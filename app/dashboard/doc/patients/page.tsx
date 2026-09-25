import { Role } from "@prisma/client";
import { requirePageSession } from "@/lib/auth";
import PatientsClient from "./PatientsClient";

export default async function Page() {
  await requirePageSession(Role.DOCTOR, Role.ADMIN);
  return <PatientsClient />;
}
