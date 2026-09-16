import { Role } from "@prisma/client";
import { requirePageSession } from "@/lib/auth";
import AdminBillingClient from "./AdminBillingClient";

export default async function Page() {
  await requirePageSession(Role.ADMIN, Role.STAFF);
  return <AdminBillingClient />;
}
