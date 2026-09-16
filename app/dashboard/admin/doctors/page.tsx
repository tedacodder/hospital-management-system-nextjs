import { Role } from "@prisma/client";
import { requirePageSession } from "@/lib/auth";
import AdminDoctorsClient from "./AdminDoctorsClient";

export default async function Page() {
  await requirePageSession(Role.ADMIN, Role.STAFF);
  return <AdminDoctorsClient />;
}
