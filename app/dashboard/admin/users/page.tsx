import { Role } from "@prisma/client";
import { requirePageSession } from "@/lib/auth";
import AdminUsersClient from "./AdminUsersClient";

// Admin-only: GET/POST /api/users both require Role.ADMIN, not STAFF. A staff
// account could reach this page without the API guard and see nothing but
// 403s, so the page guard mirrors the API guard exactly.
export default async function Page() {
  await requirePageSession(Role.ADMIN);
  return <AdminUsersClient />;
}
