import { prisma } from "@/lib/prisma";
import { ok, parseBody, route } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

const SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  address: true,
  age: true,
  gender: true,
  createdAt: true,
} as const;

/// The signed-in user's own profile. Every role uses this same endpoint —
/// there is no separate "patient profile" vs "doctor profile" identity record.
export const GET = route(async () => {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: SELECT,
  });
  return ok(user);
});

export const PATCH = route(async (req: Request) => {
  const session = await requireSession();
  const input = await parseBody(req, updateProfileSchema);

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: input,
    select: SELECT,
  });

  await recordAudit({
    actorId: session.user.id,
    action: "profile.updated",
    entity: "User",
    entityId: session.user.id,
  });

  return ok(user);
});
