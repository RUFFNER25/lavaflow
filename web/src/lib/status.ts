import type { PackageStatus } from "@/lib/types";

export const STATUS_LABELS: Record<PackageStatus, string> = {
  RECIBIDO: "Recibido",
  EN_PROCESO: "En proceso",
  LISTO_PARA_ENTREGA: "Listo para entrega",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export const STATUS_FLOW: PackageStatus[] = [
  "RECIBIDO",
  "EN_PROCESO",
  "LISTO_PARA_ENTREGA",
  "ENTREGADO",
];

export const STATUS_COLORS: Record<PackageStatus, string> = {
  RECIBIDO: "bg-sky-100 text-sky-800 ring-1 ring-sky-200/80",
  EN_PROCESO: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
  LISTO_PARA_ENTREGA: "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200/80",
  ENTREGADO: "bg-blue-50 text-blue-800 ring-1 ring-blue-200/70",
  CANCELADO: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/80",
};

export function canTransition(from: PackageStatus, to: PackageStatus) {
  if (from === to) return false;
  if (from === "CANCELADO" || from === "ENTREGADO") return false;
  if (to === "CANCELADO") return true;
  const fromIdx = STATUS_FLOW.indexOf(from);
  const toIdx = STATUS_FLOW.indexOf(to);
  if (fromIdx < 0 || toIdx < 0) return false;
  return toIdx > fromIdx;
}

/** Siguiente estado natural del flujo */
export function primaryNextStatus(from: PackageStatus): PackageStatus | null {
  const idx = STATUS_FLOW.indexOf(from);
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

export function availableTransitions(from: PackageStatus): PackageStatus[] {
  return STATUS_FLOW.filter((s) => canTransition(from, s));
}
