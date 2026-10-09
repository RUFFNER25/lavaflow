"use client";

import { useState } from "react";
import {
  STATUS_LABELS,
  availableTransitions,
  primaryNextStatus,
} from "@/lib/status";
import type { PackageStatus } from "@/lib/types";

type Props = {
  packageId: string;
  status: PackageStatus;
  onUpdated?: (next: PackageStatus, whatsappQueued?: boolean) => void;
  compact?: boolean;
};

export function StatusQuickActions({
  packageId,
  status,
  onUpdated,
  compact = false,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const next = primaryNextStatus(status);
  const options = availableTransitions(status);
  const done = status === "ENTREGADO" || status === "CANCELADO";

  async function apply(to: PackageStatus) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/packages/${packageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "No se pudo actualizar");
        return;
      }
      onUpdated?.(to, Boolean(json.data?.whatsappQueued));
    } catch {
      setError("Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <span className="text-xs font-medium text-sky-500/80">—</span>
    );
  }

  // Tras filtrar ENTREGADO/CANCELADO, siempre se puede cancelar desde aquí
  const otherOptions: PackageStatus[] = [
    ...options.filter((s) => s !== next),
    "CANCELADO",
  ];

  return (
    <div
      className={compact ? "flex flex-wrap items-center gap-1.5" : "space-y-2"}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {next && (
        <button
          type="button"
          disabled={busy}
          onClick={() => apply(next)}
          className={
            compact
              ? "inline-flex h-8 items-center rounded-lg border border-sky-200 bg-sky-50 px-2.5 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 disabled:opacity-50"
              : "inline-flex h-10 w-full items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sm font-semibold text-sky-800 transition active:bg-sky-100 disabled:opacity-50"
          }
        >
          {busy ? "…" : `→ ${STATUS_LABELS[next]}`}
        </button>
      )}

      {otherOptions.length > 0 && (
        <select
          className={
            compact
              ? "h-8 max-w-[7.5rem] rounded-lg border border-sky-200 bg-white px-1.5 text-xs font-medium text-sky-700 outline-none disabled:opacity-50"
              : "h-10 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm font-medium text-sky-800 outline-none"
          }
          value=""
          disabled={busy}
          aria-label="Otro estado"
          onChange={(e) => {
            const v = e.target.value as PackageStatus;
            if (v) apply(v);
          }}
        >
          <option value="">Más…</option>
          {otherOptions.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      )}

      {error && (
        <p className="basis-full text-[11px] font-semibold text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
