import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "./prisma";

export async function buildPackagePdf(packageId: string): Promise<Uint8Array> {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    include: {
      customer: true,
      tenant: true,
      washType: true,
      createdBy: { select: { name: true } },
    },
  });

  if (!pkg) throw new Error("Paquete no encontrado");

  const doc = await PDFDocument.create();
  const page = doc.addPage([226.77, 500]); // ~80mm ticket width
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const width = page.getWidth();
  let y = page.getHeight() - 24;
  const left = 12;
  const right = width - 12;

  const center = (text: string, size: number, bold = false) => {
    const f = bold ? fontBold : font;
    const tw = f.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - tw) / 2,
      y,
      size,
      font: f,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= size + 6;
  };

  const line = (label: string, value: string, size = 9) => {
    page.drawText(label, { x: left, y, size, font, color: rgb(0.35, 0.35, 0.35) });
    const vw = fontBold.widthOfTextAtSize(value, size);
    page.drawText(value, {
      x: right - vw,
      y,
      size,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= size + 8;
  };

  const sep = () => {
    page.drawLine({
      start: { x: left, y },
      end: { x: right, y },
      thickness: 0.5,
      color: rgb(0.75, 0.75, 0.75),
    });
    y -= 12;
  };

  center(pkg.tenant.name.toUpperCase(), 12, true);
  if (pkg.tenant.address) center(pkg.tenant.address.slice(0, 36), 7);
  if (pkg.tenant.phone) center(`Tel: ${pkg.tenant.phone}`, 7);
  if (pkg.tenant.ruc) center(`RUC: ${pkg.tenant.ruc}`, 7);
  y -= 4;
  sep();
  center("COMPROBANTE DE LAVADO", 9, true);
  center(pkg.code, 11, true);
  y -= 2;
  sep();

  line("Fecha", formatDate(pkg.createdAt));
  line("Cliente", pkg.customer.fullName.slice(0, 22));
  line("DNI", pkg.customer.dni);
  if (pkg.customer.phone) line("Tel", pkg.customer.phone);
  sep();
  line("Lavado", pkg.washType.name);
  line("Peso", `${Number(pkg.weightKg).toFixed(2)} kg`);
  line("P. unit.", `S/ ${Number(pkg.pricePerKg).toFixed(2)}`);
  if (Number(pkg.discount) > 0) line("Desc.", `S/ ${Number(pkg.discount).toFixed(2)}`);
  sep();
  line("TOTAL", `S/ ${Number(pkg.total).toFixed(2)}`, 11);
  sep();
  center(`Estado: ${statusLabel(pkg.status)}`, 8);
  center(`Atendido por: ${pkg.createdBy.name}`, 7);
  y -= 8;
  center("Conserve este ticket", 7);
  center("Gracias por su preferencia", 7);

  return doc.save();
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(d);
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    RECIBIDO: "Recibido",
    EN_PROCESO: "En proceso",
    LISTO_PARA_ENTREGA: "Listo",
    ENTREGADO: "Entregado",
    CANCELADO: "Cancelado",
  };
  return map[s] || s;
}
