import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

function authorize(req: Request) {
  const key = req.headers.get("x-internal-key");
  return key && key === process.env.INTERNAL_API_KEY;
}

const schema = z.object({
  ok: z.boolean(),
  error: z.string().optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    if (!authorize(req)) return jsonError("No autorizado", 401);
    const { id } = await ctx.params;
    const body = schema.parse(await req.json());

    const msg = await prisma.messageQueue.findUnique({ where: { id } });
    if (!msg) return jsonError("No encontrado", 404);

    if (body.ok) {
      await prisma.messageQueue.update({
        where: { id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          lastError: null,
        },
      });
    } else {
      const failedPermanently = msg.attempts >= msg.maxAttempts;
      const backoffMin = Math.min(2 ** msg.attempts, 60);
      await prisma.messageQueue.update({
        where: { id },
        data: {
          status: failedPermanently ? "FAILED" : "PENDING",
          lastError: (body.error || "Error desconocido").slice(0, 500),
          scheduledAt: failedPermanently
            ? msg.scheduledAt
            : new Date(Date.now() + backoffMin * 60_000),
        },
      });
    }

    return jsonOk({ updated: true });
  } catch (err) {
    return handleApiError(err);
  }
}
