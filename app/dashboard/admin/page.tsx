import { Role } from "@prisma/client";
import { requirePageSession } from "@/lib/auth";
import AdminOverviewClient from "./AdminOverviewClient";

export default async function Page() {
  await requirePageSession(Role.ADMIN, Role.STAFF);
  return <AdminOverviewClient />;
}
