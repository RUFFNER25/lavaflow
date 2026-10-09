import { requireTenantSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const tenantId = session.tenantId!;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [byStatus, todayCount, todayRevenue, pendingWhatsApp] = await Promise.all([
      prisma.package.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: true,
      }),
      prisma.package.count({
        where: { tenantId, createdAt: { gte: startOfDay } },
      }),
      prisma.package.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfDay },
          status: { not: "CANCELADO" },
        },
        _sum: { total: true },
      }),
      prisma.messageQueue.count({
        where: {
          tenantId,
          status: { in: ["PENDING", "FAILED", "SENDING"] },
        },
      }),
    ]);

    const statusMap = Object.fromEntries(
      byStatus.map((s) => [s.status, s._count])
    ) as Record<string, number>;

    return jsonOk({
      todayCount,
      todayRevenue: Number(todayRevenue._sum.total || 0),
      pendingWhatsApp,
      byStatus: statusMap,
      ready: statusMap.LISTO_PARA_ENTREGA || 0,
      inProcess: statusMap.EN_PROCESO || 0,
      received: statusMap.RECIBIDO || 0,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
