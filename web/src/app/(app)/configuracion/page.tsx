"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Input,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";
import { money } from "@/lib/format";

type WashType = { id: string; name: string; description: string | null; active: boolean };
type GarmentType = { id: string; name: string; active: boolean };
type PriceRule = {
  id: string;
  washTypeId: string;
  garmentTypeId: string | null;
  pricePerKg: string | number;
  minCharge: string | number;
  active: boolean;
  washType: { name: string };
  garmentType: { name: string } | null;
};
type Tenant = {
  name: string;
  phone: string | null;
  address: string | null;
  ruc: string | null;
  logoUrl: string | null;
};
type WaConfig = {
  connected: boolean;
  phoneNumber: string | null;
  readyTemplate: string;
  receiptTemplate: string;
};

export default function ConfiguracionPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"precios" | "lavados" | "prendas" | "negocio" | "whatsapp">(
    "precios"
  );
  const [washTypes, setWashTypes] = useState<WashType[]>([]);
  const [garmentTypes, setGarmentTypes] = useState<GarmentType[]>([]);
  const [prices, setPrices] = useState<PriceRule[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [wa, setWa] = useState<WaConfig | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // forms
  const [washName, setWashName] = useState("");
  const [garmentName, setGarmentName] = useState("");
  const [priceWashId, setPriceWashId] = useState("");
  const [priceGarmentId, setPriceGarmentId] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [minCharge, setMinCharge] = useState("10");

  async function reload() {
    const [w, g, p, t, q] = await Promise.all([
      fetch("/api/config/wash-types").then((r) => r.json()),
      fetch("/api/config/garment-types").then((r) => r.json()),
      fetch("/api/config/prices").then((r) => r.json()),
      fetch("/api/config/tenant").then((r) => r.json()),
      fetch("/api/config/whatsapp").then((r) => r.json()),
    ]);
    if (w.ok) setWashTypes(w.data);
    if (g.ok) setGarmentTypes(g.data);
    if (p.ok) setPrices(p.data);
    if (t.ok) setTenant(t.data);
    if (q.ok) setWa(q.data);
    if (w.ok && w.data[0] && !priceWashId) setPriceWashId(w.data[0].id);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flash(ok: string) {
    setMsg(ok);
    setErr("");
    setTimeout(() => setMsg(""), 3000);
  }

  async function addWash(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/config/wash-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: washName }),
    });
    const json = await res.json();
    if (!json.ok) return setErr(json.error);
    setWashName("");
    flash("Tipo de lavado creado");
    reload();
  }

  async function addGarment(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/config/garment-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: garmentName }),
    });
    const json = await res.json();
    if (!json.ok) return setErr(json.error);
    setGarmentName("");
    flash("Tipo de prenda creado");
    reload();
  }

  async function addPrice(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/config/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        washTypeId: priceWashId,
        garmentTypeId: priceGarmentId || null,
        pricePerKg: Number(pricePerKg),
        minCharge: Number(minCharge) || 0,
      }),
    });
    const json = await res.json();
    if (!json.ok) return setErr(json.error);
    setPricePerKg("");
    flash("Precio guardado");
    reload();
  }

  async function toggleWash(id: string, active: boolean) {
    await fetch(`/api/config/wash-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    reload();
  }

  async function toggleGarment(id: string, active: boolean) {
    await fetch(`/api/config/garment-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    reload();
  }

  async function saveTenant(e: FormEvent) {
    e.preventDefault();
    if (!tenant) return;
    const res = await fetch("/api/config/tenant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: tenant.name,
        phone: tenant.phone,
        address: tenant.address,
        ruc: tenant.ruc,
      }),
    });
    const json = await res.json();
    if (!json.ok) return setErr(json.error);
    flash("Datos del negocio actualizados");
  }

  async function uploadLogo(file: File | null) {
    if (!file) return;
    setUploadingLogo(true);
    setErr("");
    try {
      const form = new FormData();
      form.append("logo", file);
      const res = await fetch("/api/config/tenant/logo", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!json.ok) {
        setErr(json.error || "No se pudo subir el logo");
        return;
      }
      setTenant(json.data);
      flash("Logo actualizado");
      router.refresh();
    } finally {
      setUploadingLogo(false);
    }
  }

  async function removeLogo() {
    setUploadingLogo(true);
    setErr("");
    try {
      const res = await fetch("/api/config/tenant/logo", { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) {
        setErr(json.error || "No se pudo quitar el logo");
        return;
      }
      setTenant(json.data);
      flash("Logo eliminado");
      router.refresh();
    } finally {
      setUploadingLogo(false);
    }
  }

  async function saveWa(e: FormEvent) {
    e.preventDefault();
    if (!wa) return;
    const res = await fetch("/api/config/whatsapp", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        readyTemplate: wa.readyTemplate,
        receiptTemplate: wa.receiptTemplate,
      }),
    });
    const json = await res.json();
    if (!json.ok) return setErr(json.error);
    flash("Plantillas WhatsApp guardadas");
  }

  const tabs = [
    ["precios", "Precios"],
    ["lavados", "Tipos de lavado"],
    ["prendas", "Tipos de prenda"],
    ["negocio", "Negocio"],
    ["whatsapp", "WhatsApp"],
  ] as const;

  return (
    <div>
      <PageHeader
        title="Configuración"
        subtitle="Precios, catálogos y plantillas — editable sin tocar código"
      />

      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
              tab === k
                ? "bg-gradient-to-b from-sky-500 to-blue-600 text-white shadow-[0_8px_18px_-12px_rgba(37,99,235,0.7)]"
                : "bg-white/90 text-sky-800 ring-1 ring-sky-200 active:bg-sky-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {msg && <div className="mb-4"><Alert tone="success">{msg}</Alert></div>}
      {err && <div className="mb-4"><Alert>{err}</Alert></div>}

      {tab === "precios" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="mb-3 font-display text-lg font-semibold">Nuevo precio</h2>
            <form onSubmit={addPrice} className="space-y-3">
              <Select
                label="Tipo de lavado"
                value={priceWashId}
                onChange={(e) => setPriceWashId(e.target.value)}
              >
                {washTypes.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
              <Select
                label="Tipo de prenda (opcional)"
                value={priceGarmentId}
                onChange={(e) => setPriceGarmentId(e.target.value)}
              >
                <option value="">General (por kg)</option>
                {garmentTypes.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Precio por kg (S/)"
                type="number"
                step="0.01"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                required
              />
              <Input
                label="Cargo mínimo (S/)"
                type="number"
                step="0.01"
                value={minCharge}
                onChange={(e) => setMinCharge(e.target.value)}
              />
              <Button type="submit">Guardar precio</Button>
            </form>
          </Card>
          <Card>
            <h2 className="mb-3 font-display text-lg font-semibold">Lista de precios</h2>
            <ul className="space-y-3 text-sm">
              {prices.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between border-b border-sky-50 pb-2"
                >
                  <div>
                    <div className="font-semibold text-sky-950">
                      {p.washType.name}
                      {p.garmentType ? ` · ${p.garmentType.name}` : " · General"}
                    </div>
                    <div className="font-medium text-sky-600/70">
                      {money(Number(p.pricePerKg))}/kg · mín. {money(Number(p.minCharge))}
                    </div>
                  </div>
                  <span
                    className={
                      p.active ? "font-bold text-cyan-700" : "font-bold text-sky-300"
                    }
                  >
                    {p.active ? "Activo" : "Inactivo"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === "lavados" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <form onSubmit={addWash} className="space-y-3">
              <Input
                label="Nombre del lavado"
                value={washName}
                onChange={(e) => setWashName(e.target.value)}
                required
              />
              <Button type="submit">Agregar</Button>
            </form>
          </Card>
          <Card>
            <ul className="space-y-2 text-sm">
              {washTypes.map((w) => (
                <li key={w.id} className="flex items-center justify-between">
                  <span className="font-medium">{w.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => toggleWash(w.id, w.active)}
                  >
                    {w.active ? "Desactivar" : "Activar"}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === "prendas" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <form onSubmit={addGarment} className="space-y-3">
              <Input
                label="Nombre de prenda"
                value={garmentName}
                onChange={(e) => setGarmentName(e.target.value)}
                required
              />
              <Button type="submit">Agregar</Button>
            </form>
          </Card>
          <Card>
            <ul className="space-y-2 text-sm">
              {garmentTypes.map((g) => (
                <li key={g.id} className="flex items-center justify-between">
                  <span className="font-medium">{g.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => toggleGarment(g.id, g.active)}
                  >
                    {g.active ? "Desactivar" : "Activar"}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === "negocio" && tenant && (
        <div className="grid max-w-3xl gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="mb-3 font-display text-lg font-semibold text-sky-950">
              Logo de la lavandería
            </h2>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl bg-sky-50 ring-1 ring-sky-100">
                {tenant.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tenant.logoUrl}
                    alt="Logo"
                    className="size-full object-contain p-1"
                  />
                ) : (
                  <span className="text-xs font-bold text-sky-400">Sin logo</span>
                )}
              </div>
              <div className="min-w-0 flex-1 text-xs font-medium text-sky-600/80">
                Se muestra en el <strong>login</strong> y en el{" "}
                <strong>menú lateral</strong>. PNG, JPG, WEBP o SVG · máx. 2 MB.
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="inline-flex cursor-pointer">
                <span className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-b from-sky-500 to-blue-600 px-4 py-3 text-sm font-bold text-white sm:w-auto sm:py-2.5">
                  {uploadingLogo ? "Subiendo…" : "Subir logo"}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  disabled={uploadingLogo}
                  onChange={(e) => uploadLogo(e.target.files?.[0] || null)}
                />
              </label>
              {tenant.logoUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={uploadingLogo}
                  onClick={removeLogo}
                >
                  Quitar
                </Button>
              )}
            </div>
          </Card>

          <Card>
            <form onSubmit={saveTenant} className="space-y-3">
              <Input
                label="Nombre comercial"
                value={tenant.name}
                onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
              />
              <Input
                label="Teléfono"
                value={tenant.phone || ""}
                onChange={(e) =>
                  setTenant({ ...tenant, phone: e.target.value })
                }
              />
              <Input
                label="Dirección"
                value={tenant.address || ""}
                onChange={(e) =>
                  setTenant({ ...tenant, address: e.target.value })
                }
              />
              <Input
                label="RUC"
                value={tenant.ruc || ""}
                onChange={(e) => setTenant({ ...tenant, ruc: e.target.value })}
              />
              <Button type="submit">Guardar</Button>
            </form>
          </Card>
        </div>
      )}

      {tab === "whatsapp" && wa && (
        <Card className="max-w-2xl space-y-4">
          <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm ring-1 ring-sky-100">
            Estado:{" "}
            <strong className={wa.connected ? "text-cyan-700" : "text-rose-600"}>
              {wa.connected ? "Conectado" : "Desconectado"}
            </strong>
            {wa.phoneNumber ? ` · ${wa.phoneNumber}` : ""}
            <p className="mt-1 text-xs font-medium text-sky-600/70">
              Escanea el QR del servicio WhatsApp (ver README). La sesión se
              guarda en disco para no volver a escanear.
            </p>
          </div>
          <form onSubmit={saveWa} className="space-y-3">
            <Textarea
              label="Plantilla: listo para recoger"
              rows={4}
              value={wa.readyTemplate}
              onChange={(e) => setWa({ ...wa, readyTemplate: e.target.value })}
            />
            <Textarea
              label="Plantilla: comprobante"
              rows={4}
              value={wa.receiptTemplate}
              onChange={(e) => setWa({ ...wa, receiptTemplate: e.target.value })}
            />
            <p className="text-xs font-medium text-sky-600/70">
              Variables: {"{{nombre}}"}, {"{{codigo}}"}, {"{{total}}"}, {"{{peso}}"},{" "}
              {"{{lavanderia}}"}, {"{{lavado}}"}
            </p>
            <Button type="submit">Guardar plantillas</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
