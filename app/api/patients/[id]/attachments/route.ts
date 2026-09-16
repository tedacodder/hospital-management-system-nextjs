import { prisma } from "@/lib/prisma";
import { created, ok, parseId, route, HttpError } from "@/lib/api";
import { assertCanAccessPatient, requireSession } from "@/lib/auth";
import { saveUpload } from "@/lib/storage";
import { recordAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

const SELECT = {
  id: true,
  filename: true,
  mimeType: true,
  sizeBytes: true,
  description: true,
  createdAt: true,
  uploadedBy: { select: { id: true, name: true, role: true } },
} as const;

/// Authorization mirrors chart access exactly — attachments are part of the
/// patient's record, not a separate permission surface. Staff read/write any;
/// a treating doctor reads/writes their patients; a patient reads/writes only
/// their own file.
export const GET = route(async (_req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const patientId = parseId((await ctx.params).id, "patient id");
  await assertCanAccessPatient(session, patientId);

  const attachments = await prisma.attachment.findMany({
    where: { patientId },
    select: SELECT,
    orderBy: { createdAt: "desc" },
  });

  return ok(attachments);
});

/// Accepts multipart/form-data with a "file" field and an optional
/// "description" field — not JSON, since the body is binary.
export const POST = route(async (req: Request, ctx: Ctx) => {
  const session = await requireSession();
  const patientId = parseId((await ctx.params).id, "patient id");
  await assertCanAccessPatient(session, patientId);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new HttpError(400, "Attach a file under the 'file' field");
  }
  const description = form.get("description");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { storageKey, sizeBytes } = await saveUpload(bytes, file.type);

  const attachment = await prisma.attachment.create({
    data: {
      patientId,
      uploadedById: session.user.id,
      filename: file.name.slice(0, 200) || "upload",
      mimeType: file.type,
      sizeBytes,
      storageKey,
      description: typeof description === "string" && description.trim() ? description.trim().slice(0, 300) : null,
    },
    select: SELECT,
  });

  await recordAudit({
    actorId: session.user.id,
    action: "attachment.uploaded",
    entity: "Patient",
    entityId: patientId,
    summary: attachment.filename,
  });

  return created(attachment);
});
