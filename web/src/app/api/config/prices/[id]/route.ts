import { z } from "zod";
import { requireTenantSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

const schema = z.object({
  pricePerKg: z.number().positive().max(9999).optional(),
  minCharge: z.number().min(0).max(9999).optional(),
  active: z.boolean().optional(),
  garmentTypeId: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTenantSession(["OWNER", "SUPER_ADMIN"]);
    const { id } = await ctx.params;
    const body = schema.parse(await req.json());
    const existing = await prisma.priceRule.findFirst({
      where: { id, tenantId: session.tenantId! },
    });
    if (!existing) return jsonError("No encontrado", 404);

    const item = await prisma.priceRule.update({
      where: { id },
      data: body,
      include: { washType: true, garmentType: true },
    });
    return jsonOk(item);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTenantSession(["OWNER", "SUPER_ADMIN"]);
    const { id } = await ctx.params;
    const existing = await prisma.priceRule.findFirst({
      where: { id, tenantId: session.tenantId! },
    });
    if (!existing) return jsonError("No encontrado", 404);
    await prisma.priceRule.delete({ where: { id } });
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
