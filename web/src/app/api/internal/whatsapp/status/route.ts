import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, handleApiError } from "@/lib/api";

function authorize(req: Request) {
  const key = req.headers.get("x-internal-key");
  return key && key === process.env.INTERNAL_API_KEY;
}

const schema = z.object({
  sessionName: z.string(),
  connected: z.boolean(),
  phoneNumber: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    if (!authorize(req)) return jsonError("No autorizado", 401);
    const body = schema.parse(await req.json());

    const config = await prisma.whatsAppConfig.findFirst({
      where: { sessionName: body.sessionName },
    });
    if (!config) return jsonError("Sesión no encontrada", 404);

    await prisma.whatsAppConfig.update({
      where: { id: config.id },
      data: {
        connected: body.connected,
        phoneNumber: body.phoneNumber || null,
        lastConnectedAt: body.connected ? new Date() : config.lastConnectedAt,
      },
    });

    return jsonOk({ updated: true });
  } catch (err) {
    return handleApiError(err);
  }
}
