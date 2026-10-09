import { z } from "zod";
import { requireTenantSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const items = await prisma.garmentType.findMany({
      where: { tenantId: session.tenantId! },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return jsonOk(items);
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(200).optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  try {
    const session = await requireTenantSession(["OWNER", "SUPER_ADMIN"]);
    const body = schema.parse(await req.json());
    const item = await prisma.garmentType.create({
      data: { ...body, tenantId: session.tenantId! },
    });
    await audit({
      tenantId: session.tenantId,
      userId: session.id,
      action: "config.garment_type.create",
      entityId: item.id,
    });
    return jsonOk(item, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
