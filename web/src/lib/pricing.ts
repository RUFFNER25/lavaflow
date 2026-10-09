import { prisma } from "./prisma";

export async function resolvePrice(params: {
  tenantId: string;
  washTypeId: string;
  garmentTypeId?: string | null;
  weightKg: number;
}) {
  const { tenantId, washTypeId, garmentTypeId, weightKg } = params;

  if (weightKg <= 0) {
    throw new Error("El peso debe ser mayor a 0");
  }

  let rule = null;
  if (garmentTypeId) {
    rule = await prisma.priceRule.findFirst({
      where: {
        tenantId,
        washTypeId,
        garmentTypeId,
        active: true,
      },
    });
  }

  if (!rule) {
    rule = await prisma.priceRule.findFirst({
      where: {
        tenantId,
        washTypeId,
        garmentTypeId: null,
        active: true,
      },
    });
  }

  if (!rule) {
    throw new Error("No hay precio configurado para este tipo de lavado");
  }

  const pricePerKg = Number(rule.pricePerKg);
  const minCharge = Number(rule.minCharge);
  const subtotal = Math.max(weightKg * pricePerKg, minCharge);
  const total = round2(subtotal);

  return {
    pricePerKg,
    minCharge,
    subtotal: total,
    total,
    priceRuleId: rule.id,
  };
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
