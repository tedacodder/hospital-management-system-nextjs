import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ok, parseBody, route, HttpError } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/// Changing your own password requires the current one — this is not the admin
/// account-creation path, which sets a password with no proof of the old one.
export const POST = route(async (req: Request) => {
  const session = await requireSession();
  // Limited per account, after auth: this is a signed-in user brute-forcing
  // their own current-password field, which the IP-based limits above don't
  // catch on a shared network.
  rateLimit(`change-password:${session.user.id}`, 10, 15 * 60_000);

  const input = await parseBody(req, changePasswordSchema);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { password: true },
  });

  const valid = await bcrypt.compare(input.currentPassword, user.password);
  if (!valid) throw new HttpError(401, "Current password is incorrect");

  const newHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: newHash },
  });

  await recordAudit({
    actorId: session.user.id,
    action: "profile.password_changed",
    entity: "User",
    entityId: session.user.id,
  });

  return ok({ changed: true });
});
