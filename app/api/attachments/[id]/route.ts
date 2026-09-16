import { prisma } from "@/lib/prisma";
import { parseId, route, HttpError } from "@/lib/api";
import { assertCanAccessPatient, isStaff, requireSession } from "@/lib/auth";
import { deleteUpload, readUpload } from "@/lib/storage";
import { recordAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

/// Streams the file back with its original type and filename. Access is
/// checked against the attachment's patient via the same chart-access rule as
/// everything else clinical — this is not a public, guessable-URL file host.
export const GET = route(async (_req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const id = parseId((await ctx.params).id, "attachment id");

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) throw new HttpError(404, "File not found");
  await assertCanAccessPatient(session, attachment.patientId);

  const bytes = await readUpload(attachment.storageKey);

  await recordAudit({
    actorId: session.user.id,
    action: "attachment.downloaded",
    entity: "Attachment",
    entityId: id,
  });

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.filename)}"`,
      "Content-Length": String(attachment.sizeBytes),
      // Patient documents are never cached by a shared cache.
      "Cache-Control": "private, no-store",
    },
  });
});

/// Deletable by whoever uploaded it, or by staff/admin — not by an arbitrary
/// treating doctor deleting another clinician's upload, and not by the patient
/// deleting a document a doctor attached to their own chart.
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const id = parseId((await ctx.params).id, "attachment id");

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) throw new HttpError(404, "File not found");

  const canDelete = isStaff(session.user.role) || attachment.uploadedById === session.user.id;
  if (!canDelete) throw new HttpError(403, "You cannot delete this file");

  await prisma.attachment.delete({ where: { id } });
  await deleteUpload(attachment.storageKey);

  await recordAudit({
    actorId: session.user.id,
    action: "attachment.deleted",
    entity: "Attachment",
    entityId: id,
    summary: attachment.filename,
  });

  return new Response(null, { status: 204 });
});
