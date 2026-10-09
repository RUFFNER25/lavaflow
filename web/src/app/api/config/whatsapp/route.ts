import { z } from "zod";
import { requireTenantSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireTenantSession();
    let config = await prisma.whatsAppConfig.findUnique({
      where: { tenantId: session.tenantId! },
    });
    if (!config) {
      const tenant = await prisma.tenant.findUniqueOrThrow({
        where: { id: session.tenantId! },
      });
      config = await prisma.whatsAppConfig.create({
        data: {
          tenantId: tenant.id,
          sessionName: `tenant-${tenant.slug}`,
        },
      });
    }
    return jsonOk(config);
  } catch (err) {
    return handleApiError(err);
  }
}

const schema = z.object({
  readyTemplate: z.string().min(10).max(1000).optional(),
  receiptTemplate: z.string().min(10).max(1000).optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await requireTenantSession(["OWNER", "SUPER_ADMIN"]);
    const body = schema.parse(await req.json());
    const config = await prisma.whatsAppConfig.upsert({
      where: { tenantId: session.tenantId! },
      create: {
        tenantId: session.tenantId!,
        sessionName: `tenant-${session.tenantId}`,
        ...body,
      },
      update: body,
    });
    return jsonOk(config);
  } catch (err) {
    return handleApiError(err);
  }
}
