import type { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

// ─────────────────────────── Configuration ───────────────────────────

// Fail loudly at boot rather than silently issuing tokens signed with
// `undefined`, which NextAuth would otherwise do in production.
const secret = process.env.NEXTAUTH_SECRET;
if (!secret && process.env.NODE_ENV === "production") {
  throw new Error("NEXTAUTH_SECRET is not set. Refusing to start.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) return null;

        const email = credentials.email.trim().toLowerCase();

        // Limited per email (stops credential stuffing against one account
        // from anywhere) and per IP (stops one source spraying many emails).
        // NextAuth's authorize only gets a plain headers object, not a full
        // Request, so IP extraction is inlined rather than reusing clientIp().
        const forwardedFor = req?.headers?.["x-forwarded-for"];
        const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(",")[0]?.trim() ?? "unknown";
        rateLimit(`login-email:${email}`, 10, 15 * 60_000);
        rateLimit(`login-ip:${ip}`, 30, 15 * 60_000);

        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Compare against a dummy hash when the user is absent so that the
        // response time does not reveal whether an email is registered.
        const hash = user?.password ?? DUMMY_HASH;
        const valid = await bcrypt.compare(credentials.password, hash);

        if (!user || !valid || !user.isActive) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = Number(user.id);
        token.role = user.role;
      }
      // `session.update()` on the client re-runs this with trigger "update" so
      // that a profile-name change shows up without forcing a full re-login.
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: { name: true, role: true, isActive: true },
        });
        if (fresh?.isActive) {
          token.name = fresh.name;
          token.role = fresh.role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Only ever redirect to our own origin.
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  secret,
};

/// A real bcrypt hash of a value no user can submit. Used only to keep the
/// failure path's timing comparable to the success path.
const DUMMY_HASH =
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

// ─────────────────────────── Guards ───────────────────────────

export type AuthedSession = Session & {
  user: { id: number; role: Role; name?: string | null; email?: string | null };
};

/// Returns the session or throws 401. Every mutating API route must call this
/// (or one of the wrappers below) before touching the database.
export async function requireSession(): Promise<AuthedSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new HttpError(401, "Authentication required");
  return session as AuthedSession;
}

/// Returns the session or throws 403 if the caller does not hold one of `roles`.
export async function requireRole(...roles: Role[]): Promise<AuthedSession> {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw new HttpError(403, "You do not have access to this resource");
  }
  return session;
}

/// Staff-side roles. Used for anything that reads across patients.
export const STAFF_ROLES: Role[] = [Role.ADMIN, Role.STAFF];
export const CLINICAL_ROLES: Role[] = [Role.ADMIN, Role.STAFF, Role.DOCTOR];

export function isStaff(role: Role) {
  return role === Role.ADMIN || role === Role.STAFF;
}

/// Resolves the Patient row owned by the session user, or throws.
export async function requireOwnPatient(session: AuthedSession) {
  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!patient) throw new HttpError(404, "No patient profile for this account");
  return patient;
}

/// Resolves the Doctor row owned by the session user, or throws.
export async function requireOwnDoctor(session: AuthedSession) {
  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!doctor) throw new HttpError(404, "No doctor profile for this account");
  return doctor;
}

/// Central rule for "may this session read this patient's chart?".
/// Admin and staff may read any; a doctor may read a patient they have or had
/// an appointment with; a patient may read only their own.
export async function assertCanAccessPatient(
  session: AuthedSession,
  patientId: number,
): Promise<void> {
  const { role, id: userId } = session.user;

  if (isStaff(role)) return;

  if (role === Role.DOCTOR) {
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!doctor) throw new HttpError(403, "Forbidden");

    const link = await prisma.appointment.findFirst({
      where: { doctorId: doctor.id, patientId },
      select: { id: true },
    });
    if (!link) {
      throw new HttpError(403, "You are not treating this patient");
    }
    return;
  }

  const own = await prisma.patient.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!own || own.id !== patientId) throw new HttpError(403, "Forbidden");
}

/// The landing route for a role, used after sign-in.
export function homeForRole(role: Role): string {
  switch (role) {
    case Role.ADMIN:
    case Role.STAFF:
      return "/dashboard/admin";
    case Role.DOCTOR:
      return "/dashboard/doc";
    default:
      return "/dashboard/user";
  }
}

// ─────────────────────────── Server-component page guards ───────────────────────────
//
// These run in server components, before any client JS ships, so an
// unauthenticated or wrong-role visitor never sees a flash of dashboard chrome.
// They redirect instead of throwing — a page has nowhere to render an
// HttpError, unlike an API route.

/// Redirects to /login if there is no session, or to /unauthorized if the
/// session's role is not in `roles`. Returns the session otherwise, so the
/// calling server component can pass session data down to its client child.
export async function requirePageSession(...roles: Role[]): Promise<AuthedSession> {
  const session = (await getServerSession(authOptions)) as AuthedSession | null;

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (roles.length > 0 && !roles.includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return session;
}
