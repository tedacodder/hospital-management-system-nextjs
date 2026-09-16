import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Configuration lives in lib/auth.ts so that server components and API routes
// can share it with getServerSession. This file is only the HTTP entry point.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
