import { z } from "zod";
import { requireTenantSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canTransition } from "@/lib/status";
import { PACKAGE_STATUSES, type PackageStatus } from "@/lib/types";
import { audit } from "@/lib/audit";
import { notifyReadyForPickup, shouldAutoNotify } from "@/lib/whatsapp-queue";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTenantSession();
    const { id } = await ctx.params;

    const pkg = await prisma.package.findFirst({
      where: { id, tenantId: session.tenantId! },
      include: {
        customer: true,
        washType: true,
        statusLogs: { orderBy: { createdAt: "asc" } },
        messages: { orderBy: { createdAt: "desc" }, take: 10 },
        createdBy: { select: { name: true } },
      },
    });

    if (!pkg) return jsonError("Paquete no encontrado", 404);
    return jsonOk(pkg);
  } catch (err) {
    return handleApiError(err);
  }
}

const patchSchema = z.object({
  status: z.enum(PACKAGE_STATUSES as [PackageStatus, ...PackageStatus[]]),
  note: z.string().max(300).optional().nullable(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTenantSession(["OWNER", "STAFF", "SUPER_ADMIN"]);
    const { id } = await ctx.params;
    const body = patchSchema.parse(await req.json());

    const existing = await prisma.package.findFirst({
      where: { id, tenantId: session.tenantId! },
    });
    if (!existing) return jsonError("Paquete no encontrado", 404);

    if (!canTransition(existing.status as PackageStatus, body.status)) {
      return jsonError(
        `No se puede pasar de ${existing.status} a ${body.status}`
      );
    }

    const now = new Date();
    const pkg = await prisma.$transaction(async (tx) => {
      const updated = await tx.package.update({
        where: { id },
        data: {
          status: body.status,
          ...(body.status === "LISTO_PARA_ENTREGA" ? { readyAt: now } : {}),
          ...(body.status === "ENTREGADO" ? { deliveredAt: now } : {}),
          ...(body.status === "CANCELADO" ? { cancelledAt: now } : {}),
        },
        include: { customer: true, washType: true },
      });

      await tx.packageStatusLog.create({
        data: {
          packageId: id,
          fromStatus: existing.status,
          toStatus: body.status,
          note: body.note || null,
          changedBy: session.id,
        },
      });

      return updated;
    });

    await audit({
      tenantId: session.tenantId,
      userId: session.id,
      action: "package.status_change",
      entityType: "Package",
      entityId: id,
      meta: { from: existing.status, to: body.status },
    });

    let whatsappQueued = false;
    if (shouldAutoNotify(body.status)) {
      try {
        const msg = await notifyReadyForPickup(id);
        whatsappQueued = Boolean(msg);
      } catch (err) {
        console.error("[auto whatsapp]", err);
      }
    }

    return jsonOk({ ...pkg, whatsappQueued });
  } catch (err) {
    return handleApiError(err);
  }
}
