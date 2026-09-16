import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Edge-level gate. This is a convenience so unauthenticated users land on the
// login page instead of a flash of dashboard chrome — it is NOT the security
// boundary. Every API route performs its own server-side authorization via
// lib/auth.ts, because middleware can be bypassed and never sees route handlers
// invoked from server components.

const ROLE_PREFIXES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/dashboard/admin", roles: ["ADMIN", "STAFF"] },
  { prefix: "/dashboard/doc", roles: ["DOCTOR", "ADMIN"] },
  { prefix: "/dashboard/user", roles: ["PATIENT", "ADMIN", "STAFF"] },
];

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role as string | undefined;
    const path = req.nextUrl.pathname;

    const rule = ROLE_PREFIXES.find((r) => path.startsWith(r.prefix));
    if (rule && role && !rule.roles.includes(role)) {
      const url = req.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
    pages: { signIn: "/login" },
  },
);

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*"],
};
