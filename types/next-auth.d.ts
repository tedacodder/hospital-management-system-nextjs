import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Teaches TypeScript about the custom claims added in lib/auth.ts.
// Without this, `session.user.role` and `token.role` are compile errors.

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    role: Role;
  }
}
