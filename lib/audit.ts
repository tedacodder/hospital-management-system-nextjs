import { prisma } from "@/lib/prisma";

/// Append-only activity trail for privileged actions.
///
/// Deliberately records the actor, the verb and the identity of the affected
/// row — never clinical content, never request bodies. Writing an audit entry
/// must never fail the action it describes, so errors are swallowed and logged.
export async function recordAudit(input: {
  actorId?: number | null;
  action: string;
  entity: string;
  entityId?: string | number | null;
  summary?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId == null ? null : String(input.entityId),
        summary: input.summary?.slice(0, 500) ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record entry:", err);
  }
}
