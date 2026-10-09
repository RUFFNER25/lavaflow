import { z } from "zod";
import { requireTenantSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolvePrice, round2 } from "@/lib/pricing";
import { generatePackageCode } from "@/lib/package-code";
import { audit } from "@/lib/audit";
import { notifyReceipt } from "@/lib/whatsapp-queue";
import { handleApiError, jsonOk } from "@/lib/api";
import { lookupDni } from "@/lib/dni";

const createSchema = z.object({
  dni: z.string().min(8).max(8),
  phone: z.string().min(7).max(20).optional().nullable(),
  fullName: z.string().min(3).optional(),
  washTypeId: z.string().min(1),
  garmentTypeId: z.string().optional().nullable(),
  weightKg: z.number().positive().max(500),
  discount: z.number().min(0).optional().default(0),
  notes: z.string().max(500).optional().nullable(),
  garmentSummary: z.string().max(300).optional().nullable(),
  sendWhatsApp: z.boolean().optional().default(false),
});

export async function GET(req: Request) {
  try {
    const session = await requireTenantSession();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim();
    const take = Math.min(Number(searchParams.get("take") || 50), 100);

    const packages = await prisma.package.findMany({
      where: {
        tenantId: session.tenantId!,
        ...(status ? { status: status as never } : {}),
        ...(q
          ? {
              OR: [
                { code: { contains: q } },
                { customer: { dni: { contains: q } } },
                { customer: { fullName: { contains: q } } },
                { customer: { phone: { contains: q } } },
              ],
            }
          : {}),
      },
      include: {
        customer: true,
        washType: true,
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    return jsonOk(packages);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireTenantSession(["OWNER", "STAFF", "SUPER_ADMIN"]);
    const body = createSchema.parse(await req.json());
    const tenantId = session.tenantId!;

    let fullName = body.fullName;
    if (!fullName) {
      const dniData = await lookupDni(body.dni);
      fullName = dniData.fullName;
    }

    const pricing = await resolvePrice({
      tenantId,
      washTypeId: body.washTypeId,
      garmentTypeId: body.garmentTypeId,
      weightKg: body.weightKg,
    });

    const discount = body.discount || 0;
    const total = Math.max(pricing.total - discount, 0);
    const code = await generatePackageCode(tenantId);

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { tenantId_dni: { tenantId, dni: body.dni } },
        create: {
          tenantId,
          dni: body.dni,
          fullName: fullName!,
          phone: body.phone || null,
        },
        update: {
          fullName: fullName!,
          ...(body.phone ? { phone: body.phone } : {}),
        },
      });

      const pkg = await tx.package.create({
        data: {
          tenantId,
          customerId: customer.id,
          createdById: session.id,
          code,
          washTypeId: body.washTypeId,
          weightKg: round2(body.weightKg),
          pricePerKg: round2(pricing.pricePerKg),
          subtotal: round2(pricing.subtotal),
          discount: round2(discount),
          total: round2(total),
          notes: body.notes || null,
          garmentSummary: body.garmentSummary || null,
          status: "RECIBIDO",
          statusLogs: {
            create: {
              toStatus: "RECIBIDO",
              changedBy: session.id,
              note: "Paquete registrado",
            },
          },
        },
        include: {
          customer: true,
          washType: true,
        },
      });

      return pkg;
    });

    await audit({
      tenantId,
      userId: session.id,
      action: "package.create",
      entityType: "Package",
      entityId: result.id,
      meta: { code: result.code, total },
    });

    if (body.sendWhatsApp) {
      try {
        const base = process.env.APP_URL || "http://localhost:3000";
        await notifyReceipt(result.id, `${base}/api/packages/${result.id}/pdf`);
      } catch (err) {
        console.error("[whatsapp enqueue receipt]", err);
      }
    }

    return jsonOk(result, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
