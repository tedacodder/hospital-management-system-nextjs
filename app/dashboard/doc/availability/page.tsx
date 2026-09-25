import { Role } from "@prisma/client";
import { requirePageSession } from "@/lib/auth";
import AvailabilityClient from "./AvailabilityClient";

export default async function Page() {
  await requirePageSession(Role.DOCTOR, Role.ADMIN);
  return <AvailabilityClient />;
}
