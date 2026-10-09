import { requireTenantSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildPackagePdf } from "@/lib/pdf";
import { handleApiError, jsonError } from "@/lib/api";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const internalKey = url.searchParams.get("key");
    const serviceKey = process.env.INTERNAL_API_KEY;

    // El worker de WhatsApp puede descargar el PDF con key interna
    let tenantId: string | null = null;
    if (internalKey && serviceKey && internalKey === serviceKey) {
      const pkg = await prisma.package.findUnique({ where: { id } });
      if (!pkg) return jsonError("No encontrado", 404);
      tenantId = pkg.tenantId;
    } else {
      const session = await requireTenantSession();
      tenantId = session.tenantId!;
      const pkg = await prisma.package.findFirst({
        where: { id, tenantId },
      });
      if (!pkg) return jsonError("No encontrado", 404);
    }

    const bytes = await buildPackagePdf(id);
    const pkg = await prisma.package.findUnique({ where: { id } });

    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${pkg?.code || "comprobante"}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
