import { Role } from "@prisma/client";
import { requirePageSession } from "@/lib/auth";
import AdminDepartmentsClient from "./AdminDepartmentsClient";

export default async function Page() {
  await requirePageSession(Role.ADMIN, Role.STAFF);
  return <AdminDepartmentsClient />;
}
