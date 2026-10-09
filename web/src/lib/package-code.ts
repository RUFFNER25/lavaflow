import { prisma } from "./prisma";

/** Código único por tenant: LAV-YYYYMMDD-XXXX */
export async function generatePackageCode(tenantId: string) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const prefix = `LAV-${y}${m}${d}-`;

  for (let attempt = 0; attempt < 8; attempt++) {
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    const code = `${prefix}${seq}`;
    const exists = await prisma.package.findUnique({
      where: { tenantId_code: { tenantId, code } },
      select: { id: true },
    });
    if (!exists) return code;
  }

  // Fallback ultra-único
  return `${prefix}${Date.now().toString().slice(-6)}`;
}
