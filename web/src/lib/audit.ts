import { prisma } from "./prisma";

export async function audit(params: {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  meta?: unknown;
  ip?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId || null,
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        meta: params.meta === undefined ? null : JSON.stringify(params.meta),
        ip: params.ip || null,
      },
    });
  } catch (err) {
    console.error("[audit] failed", err);
  }
}
