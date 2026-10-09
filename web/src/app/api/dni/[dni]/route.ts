import { requireTenantSession } from "@/lib/auth";
import { lookupDni } from "@/lib/dni";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ dni: string }> }
) {
  try {
    const session = await requireTenantSession();
    const { dni } = await ctx.params;
    const result = await lookupDni(dni);

    const existing = await prisma.customer.findUnique({
      where: {
        tenantId_dni: { tenantId: session.tenantId!, dni: result.dni },
      },
    });

    return jsonOk({
      ...result,
      phone: existing?.phone || null,
      email: existing?.email || null,
      address: existing?.address || null,
      customerId: existing?.id || null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
