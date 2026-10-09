import { z } from "zod";
import { requireTenantSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(200).optional().nullable(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTenantSession(["OWNER", "SUPER_ADMIN"]);
    const { id } = await ctx.params;
    const body = schema.parse(await req.json());
    const existing = await prisma.garmentType.findFirst({
      where: { id, tenantId: session.tenantId! },
    });
    if (!existing) return jsonError("No encontrado", 404);
    const item = await prisma.garmentType.update({ where: { id }, data: body });
    return jsonOk(item);
  } catch (err) {
    return handleApiError(err);
  }
}
