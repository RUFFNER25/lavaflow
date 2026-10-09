import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/api";

function authorize(req: Request) {
  const key = req.headers.get("x-internal-key");
  return key && key === process.env.INTERNAL_API_KEY;
}

/** El worker de WhatsApp reclama mensajes pendientes (con reintentos). */
export async function POST(req: Request) {
  if (!authorize(req)) return jsonError("No autorizado", 401);

  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit") || 5), 20);
  const now = new Date();

  const pending = await prisma.messageQueue.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      scheduledAt: { lte: now },
      attempts: { lt: 5 },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit,
    include: {
      tenant: { include: { whatsappConfig: true } },
    },
  });

  const claimed = [];
  for (const msg of pending) {
    const updated = await prisma.messageQueue.updateMany({
      where: {
        id: msg.id,
        status: { in: ["PENDING", "FAILED"] },
        attempts: msg.attempts,
      },
      data: {
        status: "SENDING",
        attempts: { increment: 1 },
      },
    });
    if (updated.count === 1) {
      claimed.push({
        ...msg,
        attempts: msg.attempts + 1,
        sessionName: msg.tenant.whatsappConfig?.sessionName || `tenant-${msg.tenantId}`,
      });
    }
  }

  return jsonOk(claimed);
}
