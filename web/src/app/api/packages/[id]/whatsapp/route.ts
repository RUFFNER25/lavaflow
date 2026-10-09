import { requireTenantSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyReceipt } from "@/lib/whatsapp-queue";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTenantSession(["OWNER", "STAFF", "SUPER_ADMIN"]);
    const { id } = await ctx.params;

    const pkg = await prisma.package.findFirst({
      where: { id, tenantId: session.tenantId! },
      include: { customer: true },
    });
    if (!pkg) return jsonError("Paquete no encontrado", 404);
    if (!pkg.customer.phone) {
      return jsonError("El cliente no tiene teléfono registrado");
    }

    const base = process.env.APP_URL || "http://localhost:3030";
    const msg = await notifyReceipt(
      id,
      `${base}/api/packages/${id}/pdf?key=${process.env.INTERNAL_API_KEY || ""}`
    );

    return jsonOk({ queued: true, messageId: msg?.id });
  } catch (err) {
    return handleApiError(err);
  }
}
