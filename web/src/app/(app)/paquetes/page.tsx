"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Button, Card, Input, PageHeader, Select } from "@/components/ui";
import { PackageListCard } from "@/components/PackageListCard";
import { StatusQuickActions } from "@/components/StatusQuickActions";
import { money, formatDate } from "@/lib/format";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/status";
import type { PackageStatus } from "@/lib/types";

type Pkg = {
  id: string;
  code: string;
  weightKg: string | number;
  total: string | number;
  status: PackageStatus;
  createdAt: string;
  customer: { fullName: string; dni: string; phone: string | null };
  washType: { name: string };
};

export default function PaquetesPage() {
  const [items, setItems] = useState<Pkg[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const res = await fetch(`/api/packages?${params}`);
    const json = await res.json();
    if (json.ok) setItems(json.data);
    setLoading(false);
  }

  function patchLocal(id: string, next: PackageStatus) {
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: next } : p))
    );
    setToast(
      next === "LISTO_PARA_ENTREGA"
        ? "Estado actualizado · WhatsApp encolado"
        : "Estado actualizado"
    );
    setTimeout(() => setToast(""), 2500);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="Paquetes"
        subtitle="Cambia el estado aquí mismo, sin entrar al detalle"
        actions={
          <Link href="/paquetes/nuevo">
            <Button>Nuevo</Button>
          </Link>
        }
      />

      {toast && (
        <div className="mb-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-800">
          {toast}
        </div>
      )}

      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
          <Input
            placeholder="Buscar…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            inputMode="search"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            onClick={load}
            variant="secondary"
            className="w-full"
          >
            Filtrar
          </Button>
        </div>
      </Card>

      <div className="space-y-3 lg:hidden">
        {loading && (
          <Card>
            <p className="py-6 text-center font-medium text-sky-600/70">
              Cargando…
            </p>
          </Card>
        )}
        {!loading &&
          items.map((p) => (
            <PackageListCard
              key={p.id}
              pkg={p}
              onUpdated={(id, next) => patchLocal(id, next)}
            />
          ))}
        {!loading && items.length === 0 && (
          <Card>
            <p className="py-6 text-center font-medium text-sky-600/70">
              Sin resultados
            </p>
          </Card>
        )}
      </div>

      <Card className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-sky-100 text-sky-600/80">
              <tr>
                <th className="pb-2.5 font-bold">Código</th>
                <th className="pb-2.5 font-bold">Cliente</th>
                <th className="pb-2.5 font-bold">Lavado</th>
                <th className="pb-2.5 font-bold">Peso</th>
                <th className="pb-2.5 font-bold">Total</th>
                <th className="pb-2.5 font-bold">Estado</th>
                <th className="pb-2.5 font-bold">Acción rápida</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center font-medium text-sky-600/70"
                  >
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((p) => (
                  <tr key={p.id} className="border-b border-sky-50 align-top">
                    <td className="py-3.5">
                      <Link
                        href={`/paquetes/${p.id}`}
                        className="font-bold text-sky-700 hover:text-sky-900 hover:underline"
                      >
                        {p.code}
                      </Link>
                      <div className="mt-0.5 text-[11px] font-medium text-sky-600/60">
                        {formatDate(p.createdAt)}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <div className="font-semibold text-sky-950">
                        {p.customer.fullName}
                      </div>
                      <div className="text-xs font-medium text-sky-600/70">
                        DNI {p.customer.dni}
                        {p.customer.phone ? ` · ${p.customer.phone}` : ""}
                      </div>
                    </td>
                    <td className="py-3.5 font-medium text-sky-800">
                      {p.washType.name}
                    </td>
                    <td className="py-3.5 font-medium text-sky-800">
                      {Number(p.weightKg).toFixed(2)} kg
                    </td>
                    <td className="py-3.5 font-semibold text-sky-900">
                      {money(Number(p.total))}
                    </td>
                    <td className="py-3.5">
                      <Badge className={STATUS_COLORS[p.status]}>
                        {STATUS_LABELS[p.status]}
                      </Badge>
                    </td>
                    <td className="py-3.5 whitespace-nowrap">
                      <StatusQuickActions
                        packageId={p.id}
                        status={p.status}
                        compact
                        onUpdated={(next) => patchLocal(p.id, next)}
                      />
                    </td>
                  </tr>
                ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center font-medium text-sky-600/70"
                  >
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
