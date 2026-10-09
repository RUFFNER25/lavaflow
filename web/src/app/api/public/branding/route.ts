import { prisma } from "@/lib/prisma";
import { jsonOk } from "@/lib/api";

/** Branding público para login (sin autenticación). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  const tenant = slug
    ? await prisma.tenant.findFirst({
        where: { slug, active: true },
        select: { name: true, logoUrl: true, slug: true },
      })
    : await prisma.tenant.findFirst({
        where: { active: true },
        orderBy: { createdAt: "asc" },
        select: { name: true, logoUrl: true, slug: true },
      });

  return jsonOk(
    tenant || {
      name: "LavaFlow",
      logoUrl: null,
      slug: null,
    }
  );
}
