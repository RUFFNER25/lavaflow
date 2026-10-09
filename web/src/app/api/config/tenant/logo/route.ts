import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { requireTenantSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

function extFromMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/svg+xml") return "svg";
  return "png";
}

export async function POST(req: Request) {
  try {
    const session = await requireTenantSession(["OWNER", "SUPER_ADMIN"]);
    const tenantId = session.tenantId!;
    const form = await req.formData();
    const file = form.get("logo");

    if (!file || !(file instanceof File)) {
      return jsonError("Selecciona un archivo de imagen");
    }
    if (!ALLOWED.has(file.type)) {
      return jsonError("Formato no permitido. Usa PNG, JPG, WEBP o SVG");
    }
    if (file.size > MAX_BYTES) {
      return jsonError("El logo no debe superar 2 MB");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = extFromMime(file.type);
    const dir = path.join(process.cwd(), "public", "uploads", "logos");
    await mkdir(dir, { recursive: true });

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    // Limpia logo anterior si estaba en uploads
    if (tenant.logoUrl?.startsWith("/uploads/logos/")) {
      const prev = path.join(process.cwd(), "public", tenant.logoUrl);
      await unlink(prev).catch(() => undefined);
    }

    const filename = `${tenantId}-${Date.now()}.${ext}`;
    const abs = path.join(dir, filename);
    await writeFile(abs, bytes);

    const logoUrl = `/uploads/logos/${filename}`;
    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl },
    });

    await audit({
      tenantId,
      userId: session.id,
      action: "config.logo.upload",
      entityType: "Tenant",
      entityId: tenantId,
      meta: { logoUrl },
    });

    return jsonOk(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE() {
  try {
    const session = await requireTenantSession(["OWNER", "SUPER_ADMIN"]);
    const tenantId = session.tenantId!;
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    if (tenant.logoUrl?.startsWith("/uploads/logos/")) {
      const prev = path.join(process.cwd(), "public", tenant.logoUrl);
      await unlink(prev).catch(() => undefined);
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl: null },
    });

    await audit({
      tenantId,
      userId: session.id,
      action: "config.logo.remove",
      entityType: "Tenant",
      entityId: tenantId,
    });

    return jsonOk(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
