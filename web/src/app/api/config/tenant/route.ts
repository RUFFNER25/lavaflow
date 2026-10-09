import { z } from "zod";
import { requireTenantSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: session.tenantId! },
    });
    return jsonOk(tenant);
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  ruc: z.string().max(20).optional().nullable(),
});

export async function PATCH(req: Request) {
  try {
    const session = await requireTenantSession(["OWNER", "SUPER_ADMIN"]);
    const body = schema.parse(await req.json());
    const tenant = await prisma.tenant.update({
      where: { id: session.tenantId! },
      data: body,
    });
    return jsonOk(tenant);
  } catch (err) {
    return handleApiError(err);
  }
}
