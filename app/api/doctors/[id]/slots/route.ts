import { z } from "zod";
import { ok, parseId, parseQuery, route } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { slotsForDay } from "@/lib/scheduling";

type Ctx = { params: Promise<{ id: string }> };

const querySchema = z.object({
  date: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
    .transform((v) => new Date(v)),
});

/// Bookable slots for a doctor on a given day, with taken ones flagged so the
/// booking form can disable them rather than failing on submit.
export const GET = route(async (req: Request, ctx: Ctx) => {
  await requireSession();
  const doctorId = parseId((await ctx.params).id, "doctor id");
  const { date } = parseQuery(req, querySchema);

  return ok(await slotsForDay(doctorId, date));
});
