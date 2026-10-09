import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-lavanderia" },
    update: {},
    create: {
      name: "Lavandería Demo",
      slug: "demo-lavanderia",
      phone: "999888777",
      address: "Av. Principal 123",
      ruc: "20123456789",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@lavanderia.local" },
    update: { passwordHash },
    create: {
      email: "admin@lavanderia.local",
      passwordHash,
      name: "Administrador",
      role: "OWNER",
      tenantId: tenant.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "super@sitech.local" },
    update: { passwordHash },
    create: {
      email: "super@sitech.local",
      passwordHash,
      name: "Super Admin SITECH",
      role: "SUPER_ADMIN",
    },
  });

  const washTypes = [
    { name: "Lavado normal", description: "Lavado estándar por kilo", sortOrder: 1 },
    { name: "Lavado + planchado", description: "Incluye planchado", sortOrder: 2 },
    { name: "Solo planchado", description: "Solo planchado", sortOrder: 3 },
    { name: "Express", description: "Entrega el mismo día", sortOrder: 4 },
  ];

  for (const wt of washTypes) {
    await prisma.washType.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: wt.name } },
      update: {},
      create: { ...wt, tenantId: tenant.id },
    });
  }

  const garmentTypes = [
    { name: "General", sortOrder: 1 },
    { name: "Edredón", sortOrder: 2 },
    { name: "Cortina", sortOrder: 3 },
    { name: "Delicate", sortOrder: 4 },
  ];

  for (const gt of garmentTypes) {
    await prisma.garmentType.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: gt.name } },
      update: {},
      create: { ...gt, tenantId: tenant.id },
    });
  }

  const washes = await prisma.washType.findMany({ where: { tenantId: tenant.id } });
  const prices: Record<string, number> = {
    "Lavado normal": 5.0,
    "Lavado + planchado": 7.5,
    "Solo planchado": 4.0,
    Express: 9.0,
  };

  for (const wash of washes) {
    const existing = await prisma.priceRule.findFirst({
      where: { tenantId: tenant.id, washTypeId: wash.id, garmentTypeId: null },
    });
    if (!existing) {
      await prisma.priceRule.create({
        data: {
          tenantId: tenant.id,
          washTypeId: wash.id,
          pricePerKg: prices[wash.name] ?? 5,
          minCharge: 10,
        },
      });
    }
  }

  await prisma.whatsAppConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      sessionName: `tenant-${tenant.slug}`,
    },
  });

  console.log("Seed OK");
  console.log("  Owner: admin@lavanderia.local / admin123");
  console.log("  Super: super@sitech.local / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
