"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  PageHeader,
  Select,
} from "@/components/ui";
import { money, formatDate } from "@/lib/format";
import {
  STATUS_COLORS,
  STATUS_FLOW,
  STATUS_LABELS,
  canTransition,
} from "@/lib/status";
import type { PackageStatus } from "@/lib/types";

type Detail = {
  id: string;
  code: string;
  status: PackageStatus;
  weightKg: string | number;
  pricePerKg: string | number;
  discount: string | number;
  total: string | number;
  notes: string | null;
  createdAt: string;
  readyAt: string | null;
  customer: {
    fullName: string;
    dni: string;
    phone: string | null;
  };
  washType: { name: string };
  createdBy: { name: string };
  statusLogs: Array<{
    id: string;
    fromStatus: PackageStatus | null;
    toStatus: PackageStatus;
    note: string | null;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    type: string;
    status: string;
    lastError: string | null;
    createdAt: string;
  }>;
};

export default function PaqueteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pkg, setPkg] = useState<Detail | null>(null);
  const [status, setStatus] = useState<PackageStatus | "">("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/packages/${id}`);
    const json = await res.json();
    if (json.ok) {
      setPkg(json.data);
      setStatus(json.data.status);
    } else {
      setError(json.error || "No encontrado");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function changeStatus() {
    if (!pkg || !status || status === pkg.status) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/packages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "No se pudo actualizar");
        return;
      }
      setSuccess(
        json.data.whatsappQueued
          ? "Estado actualizado. Se encoló aviso por WhatsApp."
          : "Estado actualizado."
      );
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function sendWhatsApp() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/packages/${id}/whatsapp`, { method: "POST" });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "No se pudo encolar WhatsApp");
        return;
      }
      setSuccess("Comprobante encolado para WhatsApp");
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!pkg && !error) {
    return <p className="font-medium text-sky-600/70">Cargando…</p>;
  }

  if (!pkg) {
    return (
      <div>
        <Alert>{error}</Alert>
        <Button className="mt-4" variant="secondary" onClick={() => router.push("/paquetes")}>
          Volver
        </Button>
      </div>
    );
  }

  const nextOptions = STATUS_FLOW.filter(
    (s) => s === pkg.status || canTransition(pkg.status, s)
  );

  return (
    <div className="mx-auto max-w-4xl pb-4">
      <PageHeader
        title={pkg.code}
        subtitle={`${pkg.customer.fullName} · DNI ${pkg.customer.dni}`}
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert tone="success">{success}</Alert>
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2 lg:hidden">
        <a
          href={`/api/packages/${pkg.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="block"
        >
          <Button variant="secondary" className="w-full">
            PDF
          </Button>
        </a>
        <Button variant="secondary" onClick={sendWhatsApp} disabled={busy}>
          WhatsApp
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* En móvil el estado va primero (acción principal) */}
        <Card className="order-1 space-y-3 lg:order-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-sky-950">
              Estado
            </h2>
            <Badge className={STATUS_COLORS[pkg.status]}>
              {STATUS_LABELS[pkg.status]}
            </Badge>
          </div>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as PackageStatus)}
          >
            {nextOptions.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
            {pkg.status !== "CANCELADO" && pkg.status !== "ENTREGADO" && (
              <option value="CANCELADO">Cancelado</option>
            )}
          </Select>
          <p className="text-xs font-medium text-sky-600/80">
            Al marcar <strong>Listo para entrega</strong> se avisa por WhatsApp.
          </p>
          <Button
            onClick={changeStatus}
            disabled={busy || status === pkg.status}
            className="w-full"
          >
            Actualizar estado
          </Button>
          <div className="hidden gap-2 lg:grid lg:grid-cols-2">
            <a
              href={`/api/packages/${pkg.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <Button variant="secondary" className="w-full">
                PDF
              </Button>
            </a>
            <Button variant="secondary" onClick={sendWhatsApp} disabled={busy}>
              WhatsApp
            </Button>
          </div>
          <Link
            href="/paquetes"
            className="block text-center text-sm font-bold text-sky-600 hover:text-sky-800"
          >
            Volver al listado
          </Link>
        </Card>

        <Card className="order-2 space-y-3 lg:order-1 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-sky-950">
            Detalle
          </h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Item label="Lavado" value={pkg.washType.name} />
            <Item label="Peso" value={`${Number(pkg.weightKg).toFixed(2)} kg`} />
            <Item label="Precio/kg" value={money(Number(pkg.pricePerKg))} />
            <Item label="Descuento" value={money(Number(pkg.discount))} />
            <Item label="Total" value={money(Number(pkg.total))} />
            <Item label="Teléfono" value={pkg.customer.phone || "—"} />
            <Item label="Registrado" value={formatDate(pkg.createdAt)} />
            <Item label="Atendido por" value={pkg.createdBy.name} />
          </dl>
          {pkg.notes && (
            <p className="rounded-2xl bg-sky-50 p-3 text-sm font-medium text-sky-800">
              {pkg.notes}
            </p>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-display text-lg font-semibold">Historial</h2>
          <ul className="space-y-3 text-sm">
            {pkg.statusLogs.map((l) => (
              <li key={l.id} className="border-b border-sky-50 pb-2">
                <div className="font-semibold text-sky-950">
                  {l.fromStatus
                    ? `${STATUS_LABELS[l.fromStatus]} → ${STATUS_LABELS[l.toStatus]}`
                    : STATUS_LABELS[l.toStatus]}
                </div>
                <div className="text-xs font-medium text-sky-600/70">
                  {formatDate(l.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-lg font-semibold">Mensajes WhatsApp</h2>
          {pkg.messages.length === 0 ? (
            <p className="text-sm font-medium text-sky-600/70">Sin mensajes aún</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {pkg.messages.map((m) => (
                <li key={m.id} className="border-b border-sky-50 pb-2">
                  <div className="font-semibold text-sky-950">
                    {m.type} · {m.status}
                  </div>
                  <div className="text-xs font-medium text-sky-600/70">
                    {formatDate(m.createdAt)}
                  </div>
                  {m.lastError && (
                    <div className="text-xs text-rose-600">{m.lastError}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sky-600/70">
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold text-sky-950">{value}</dd>
    </div>
  );
}
