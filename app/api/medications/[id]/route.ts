import { HttpError, ok, route } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getMedicationById } from "@/lib/medications/service";

// Next.js 15 delivers dynamic route params as a Promise.
type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  const session = await requireSession();
  rateLimit(`medications-detail:${session.user.id}`, 60, 60_000);

  const { id } = await ctx.params;
  const medication = await getMedicationById(id);
  if (!medication) throw new HttpError(404, "Medication not found");

  return ok(medication);
});
