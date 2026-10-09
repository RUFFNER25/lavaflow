import { z } from "zod";

const dniResultSchema = z.object({
  dni: z.string(),
  fullName: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export type DniResult = z.infer<typeof dniResultSchema>;

/**
 * Consulta DNI vía APITMS / apifacturacion.com
 * POST https://api.apifacturacion.com/dni/{dni}  body: token=...
 * Docs: https://apifacturacion.com/
 */
export async function lookupDni(dni: string): Promise<DniResult> {
  const clean = dni.replace(/\D/g, "");
  if (!/^\d{8}$/.test(clean)) {
    throw new DniError("El DNI debe tener 8 dígitos");
  }

  const token = process.env.DNI_API_TOKEN;
  const baseUrl =
    process.env.DNI_API_URL || "https://api.apifacturacion.com/dni/{dni}";

  if (!token) {
    if (process.env.DNI_DEMO_MODE === "true") {
      return {
        dni: clean,
        fullName: `CLIENTE DEMO ${clean}`,
        firstName: "CLIENTE",
        lastName: `DEMO ${clean}`,
      };
    }
    throw new DniError("API de DNI no configurada (DNI_API_TOKEN)");
  }

  if (process.env.DNI_DEMO_MODE === "true") {
    // Token presente: priorizar API real
  }

  const url = baseUrl.includes("{dni}")
    ? baseUrl.replace("{dni}", clean)
    : `${baseUrl.replace(/\/$/, "")}/${clean}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const body = new URLSearchParams({ token });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: controller.signal,
      cache: "no-store",
    });

    const rawText = await res.text();
    let raw: unknown = null;
    try {
      raw = rawText ? JSON.parse(rawText) : null;
    } catch {
      throw new DniError("Respuesta inválida de la API de DNI");
    }

    if (!res.ok) {
      if (res.status === 404) throw new DniError("DNI no encontrado");
      if (res.status === 401 || res.status === 403) {
        throw new DniError("Token de API DNI inválido o vencido");
      }
      const msg =
        typeof raw === "object" &&
        raw &&
        "message" in raw &&
        typeof (raw as { message: unknown }).message === "string"
          ? (raw as { message: string }).message
          : `Error consultando DNI (${res.status})`;
      throw new DniError(msg);
    }

    // Algunas respuestas vienen con success:false y HTTP 200
    if (
      typeof raw === "object" &&
      raw &&
      "success" in raw &&
      (raw as { success: unknown }).success === false
    ) {
      const msg =
        "message" in raw && typeof (raw as { message: unknown }).message === "string"
          ? (raw as { message: string }).message
          : "DNI no encontrado";
      throw new DniError(msg);
    }

    const normalized = normalizeDniPayload(raw, clean);
    return dniResultSchema.parse(normalized);
  } catch (err) {
    if (err instanceof DniError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new DniError("Tiempo de espera agotado al consultar DNI");
    }
    throw new DniError("No se pudo consultar el DNI. Reintente.");
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeDniPayload(raw: unknown, dni: string): DniResult {
  const data = (raw as Record<string, unknown>)?.data ?? raw;
  const obj = data as Record<string, unknown>;

  // apifacturacion: { cliente: "NOMBRES APELLIDOS", ... }
  const fullName =
    String(
      obj.cliente ||
        obj.nombre_completo ||
        obj.nombreCompleto ||
        obj.nombres_completos ||
        obj.fullName ||
        [
          obj.nombres || obj.nombresCompletos,
          obj.apellidoPaterno || obj.apellido_paterno,
          obj.apellidoMaterno || obj.apellido_materno,
        ]
          .filter(Boolean)
          .join(" ") ||
        ""
    ).trim();

  if (!fullName) {
    throw new DniError("Respuesta de API DNI incompleta");
  }

  return {
    dni,
    fullName: fullName.toUpperCase(),
    firstName:
      String(obj.nombres || obj.firstName || "").toUpperCase() || undefined,
    lastName:
      String(
        obj.apellidos ||
          [
            obj.apellidoPaterno || obj.apellido_paterno,
            obj.apellidoMaterno || obj.apellido_materno,
          ]
            .filter(Boolean)
            .join(" ")
      )
        .toUpperCase() || undefined,
  };
}

export class DniError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DniError";
  }
}
