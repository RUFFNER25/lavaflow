export type Role = "SUPER_ADMIN" | "OWNER" | "STAFF";

export type PackageStatus =
  | "RECIBIDO"
  | "EN_PROCESO"
  | "LISTO_PARA_ENTREGA"
  | "ENTREGADO"
  | "CANCELADO";

export type MessageStatus = "PENDING" | "SENDING" | "SENT" | "FAILED";

export type MessageType = "COMPROBANTE" | "LISTO_PARA_RECOGER" | "MANUAL";

export const PACKAGE_STATUSES: PackageStatus[] = [
  "RECIBIDO",
  "EN_PROCESO",
  "LISTO_PARA_ENTREGA",
  "ENTREGADO",
  "CANCELADO",
];
