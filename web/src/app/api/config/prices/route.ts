import { z } from "zod";
import { requireTenantSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const items = await prisma.priceRule.findMany({
      where: { tenantId: session.tenantId! },
      include: { washType: true, garmentType: true },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk(items);
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({
  washTypeId: z.string().min(1),
  garmentTypeId: z.string().optional().nullable(),
  pricePerKg: z.number().positive().max(9999),
  minCharge: z.number().min(0).max(9999).optional().default(0),
  active: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  try {
    const session = await requireTenantSession(["OWNER", "SUPER_ADMIN"]);
    const body = schema.parse(await req.json());
    const item = await prisma.priceRule.create({
      data: {
        tenantId: session.tenantId!,
        washTypeId: body.washTypeId,
        garmentTypeId: body.garmentTypeId || null,
        pricePerKg: body.pricePerKg,
        minCharge: body.minCharge ?? 0,
        active: body.active ?? true,
      },
      include: { washType: true, garmentType: true },
    });
    await audit({
      tenantId: session.tenantId,
      userId: session.id,
      action: "config.price.create",
      entityId: item.id,
    });
    return jsonOk(item, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
