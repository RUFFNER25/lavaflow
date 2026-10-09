import type { MessageType, PackageStatus } from "@/lib/types";
import { prisma } from "./prisma";
import { normalizePhonePe, renderTemplate } from "./templates";

export async function enqueueWhatsApp(params: {
  tenantId: string;
  packageId?: string;
  phone: string;
  type: MessageType;
  body: string;
  mediaUrl?: string;
  delayMs?: number;
}) {
  const phone = normalizePhonePe(params.phone);
  if (!phone) {
    throw new Error("Teléfono inválido para WhatsApp");
  }

  return prisma.messageQueue.create({
    data: {
      tenantId: params.tenantId,
      packageId: params.packageId,
      phone,
      type: params.type,
      body: params.body,
      mediaUrl: params.mediaUrl,
      scheduledAt: new Date(Date.now() + (params.delayMs || 0)),
      status: "PENDING",
      maxAttempts: 5,
    },
  });
}

export async function notifyReadyForPickup(packageId: string) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    include: {
      customer: true,
      tenant: { include: { whatsappConfig: true } },
      washType: true,
    },
  });

  if (!pkg) return null;
  if (!pkg.customer.phone) {
    console.warn(`[whatsapp] Pedido ${pkg.code} sin teléfono, no se notifica`);
    return null;
  }

  const template =
    pkg.tenant.whatsappConfig?.readyTemplate ||
    "Hola {{nombre}}, tu ropa (pedido {{codigo}}) ya está lista para recoger en {{lavanderia}}.";

  const body = renderTemplate(template, {
    nombre: pkg.customer.fullName.split(" ")[0],
    codigo: pkg.code,
    lavanderia: pkg.tenant.name,
    total: Number(pkg.total).toFixed(2),
    peso: Number(pkg.weightKg).toFixed(2),
    lavado: pkg.washType.name,
  });

  return enqueueWhatsApp({
    tenantId: pkg.tenantId,
    packageId: pkg.id,
    phone: pkg.customer.phone,
    type: "LISTO_PARA_RECOGER",
    body,
  });
}

export async function notifyReceipt(packageId: string, pdfPublicUrl?: string) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    include: {
      customer: true,
      tenant: { include: { whatsappConfig: true } },
      washType: true,
    },
  });

  if (!pkg?.customer.phone) return null;

  const template =
    pkg.tenant.whatsappConfig?.receiptTemplate ||
    "Hola {{nombre}}, comprobante de pedido {{codigo}} por S/ {{total}}. Peso: {{peso}} kg.";

  const body = renderTemplate(template, {
    nombre: pkg.customer.fullName.split(" ")[0],
    codigo: pkg.code,
    lavanderia: pkg.tenant.name,
    total: Number(pkg.total).toFixed(2),
    peso: Number(pkg.weightKg).toFixed(2),
    lavado: pkg.washType.name,
  });

  return enqueueWhatsApp({
    tenantId: pkg.tenantId,
    packageId: pkg.id,
    phone: pkg.customer.phone,
    type: "COMPROBANTE",
    body,
    mediaUrl: pdfPublicUrl,
  });
}

export function shouldAutoNotify(status: PackageStatus) {
  return status === "LISTO_PARA_ENTREGA";
}
