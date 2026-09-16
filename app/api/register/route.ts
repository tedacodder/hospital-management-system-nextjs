import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { created, parseBody, route, HttpError } from "@/lib/api";
import { registerSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/// Public self-service registration.
///
/// The role is hard-coded to PATIENT and is never read from the request body.
/// The previous implementation passed `role` straight through, which let anyone
/// provision an administrator account.
export const POST = route(async (req: Request) => {
  // 5 accounts per IP per hour. Registration is the cheapest way to spray the
  // database or probe for taken emails, so it's limited before any DB work.
  rateLimit(`register:${clientIp(req)}`, 5, 60 * 60_000);

  const input = await parseBody(req, registerSchema);

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw new HttpError(409, "An account with that email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: passwordHash,
        role: Role.PATIENT,
        phone: input.phone ?? "",
        address: input.address ?? "",
        age: input.age ?? "",
        gender: input.gender ?? "",
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const patient = await tx.patient.create({
      data: { userId: u.id },
      select: { id: true },
    });

    await tx.patient.update({
      where: { id: patient.id },
      data: { mrn: `P-${String(patient.id).padStart(6, "0")}` },
    });

    return u;
  });

  await recordAudit({
    actorId: user.id,
    action: "user.registered",
    entity: "User",
    entityId: user.id,
  });

  // Never echo the password hash back to the client.
  return created(user);
});
