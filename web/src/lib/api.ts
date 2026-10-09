import { NextResponse } from "next/server";
import { AuthError } from "./auth";
import { DniError } from "./dni";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

export function handleApiError(err: unknown) {
  console.error("[api]", err);

  if (err instanceof AuthError) {
    return jsonError(err.message, err.status);
  }
  if (err instanceof DniError) {
    return jsonError(err.message, 400);
  }
  if (err instanceof ZodError) {
    return jsonError("Datos inválidos", 400, err.flatten());
  }
  if (err instanceof Error) {
    return jsonError(err.message || "Error interno", 500);
  }
  return jsonError("Error interno", 500);
}
