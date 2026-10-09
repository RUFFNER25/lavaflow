"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

type WashType = { id: string; name: string; active: boolean };
type GarmentType = { id: string; name: string; active: boolean };
type PriceRule = {
  id: string;
  washTypeId: string;
  garmentTypeId: string | null;
  pricePerKg: string | number;
  minCharge: string | number;
  active: boolean;
};

export default function NuevoPaquetePage() {
  const router = useRouter();
  const [washTypes, setWashTypes] = useState<WashType[]>([]);
  const [garmentTypes, setGarmentTypes] = useState<GarmentType[]>([]);
  const [prices, setPrices] = useState<PriceRule[]>([]);
  const [dni, setDni] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [washTypeId, setWashTypeId] = useState("");
  const [garmentTypeId, setGarmentTypeId] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/config/wash-types").then((r) => r.json()),
      fetch("/api/config/garment-types").then((r) => r.json()),
      fetch("/api/config/prices").then((r) => r.json()),
    ]).then(([w, g, p]) => {
      if (w.ok) {
        const active = w.data.filter((x: WashType) => x.active);
        setWashTypes(active);
        if (active[0]) setWashTypeId(active[0].id);
      }
      if (g.ok) setGarmentTypes(g.data.filter((x: GarmentType) => x.active));
      if (p.ok) setPrices(p.data.filter((x: PriceRule) => x.active));
    });
  }, []);

  const quote = useMemo(() => {
    const weight = Number(weightKg);
    if (!washTypeId || !weight || weight <= 0) return null;

    let rule =
      prices.find(
        (p) =>
          p.washTypeId === washTypeId &&
          p.garmentTypeId === (garmentTypeId || null)
      ) ||
      prices.find((p) => p.washTypeId === washTypeId && !p.garmentTypeId);

    if (!rule) return null;
    const pricePerKg = Number(rule.pricePerKg);
    const minCharge = Number(rule.minCharge);
    const subtotal = Math.max(weight * pricePerKg, minCharge);
    const disc = Number(discount) || 0;
    const total = Math.max(subtotal - disc, 0);
    return { pricePerKg, subtotal, total };
  }, [washTypeId, garmentTypeId, weightKg, discount, prices]);

  async function lookupDni() {
    setError("");
    setInfo("");
    if (!/^\d{8}$/.test(dni)) {
      setError("Ingresa un DNI de 8 dígitos");
      return;
    }
    setLookingUp(true);
    try {
      const res = await fetch(`/api/dni/${dni}`);
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "No se pudo consultar el DNI");
        return;
      }
      setFullName(json.data.fullName);
      if (json.data.phone) setPhone(json.data.phone);
      setInfo(
        json.data.customerId
          ? "Cliente existente — datos autocompletados"
          : "Datos obtenidos de la API de DNI"
      );
    } catch {
      setError("Error al consultar DNI");
    } finally {
      setLookingUp(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dni,
          fullName,
          phone: phone || null,
          washTypeId,
          garmentTypeId: garmentTypeId || null,
          weightKg: Number(weightKg),
          discount: Number(discount) || 0,
          notes: notes || null,
          sendWhatsApp,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "No se pudo guardar");
        return;
      }
      router.push(`/paquetes/${json.data.id}`);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Nuevo paquete"
        subtitle="Ingresa DNI y peso — el sistema completa el resto"
      />

      <Card>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Input
              label="DNI"
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="12345678"
              inputMode="numeric"
              required
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                onClick={lookupDni}
                disabled={lookingUp}
                className="w-full sm:w-auto"
              >
                {lookingUp ? "Consultando…" : "Autocompletar"}
              </Button>
            </div>
          </div>

          <Input
            label="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Teléfono WhatsApp"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="999888777"
            inputMode="tel"
            autoComplete="tel"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Tipo de lavado"
              value={washTypeId}
              onChange={(e) => setWashTypeId(e.target.value)}
              required
            >
              {washTypes.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
            <Select
              label="Tipo de prenda (opcional)"
              value={garmentTypeId}
              onChange={(e) => setGarmentTypeId(e.target.value)}
            >
              <option value="">General</option>
              {garmentTypes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Peso (kg)"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              required
            />
            <Input
              label="Descuento (S/)"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>

          <Textarea
            label="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />

          <label className="flex items-center gap-2 text-sm font-semibold text-sky-800/80">
            <input
              type="checkbox"
              checked={sendWhatsApp}
              onChange={(e) => setSendWhatsApp(e.target.checked)}
              className="size-4 rounded-md border-sky-300 text-sky-600"
            />
            Enviar comprobante por WhatsApp al guardar
          </label>

          {quote && (
            <div className="rounded-[1.25rem] bg-gradient-to-br from-sky-50 to-blue-50 px-4 py-3.5 text-sm text-sky-900 ring-1 ring-sky-200/80">
              <div className="flex justify-between font-medium">
                <span className="text-sky-700/80">Precio/kg</span>
                <strong>{money(quote.pricePerKg)}</strong>
              </div>
              <div className="mt-1.5 flex justify-between font-medium">
                <span className="text-sky-700/80">Subtotal</span>
                <strong>{money(quote.subtotal)}</strong>
              </div>
              <div className="mt-2.5 flex justify-between border-t border-sky-200/80 pt-2.5 text-base">
                <span className="font-bold text-sky-800">Total</span>
                <strong className="font-display text-lg text-sky-950">
                  {money(quote.total)}
                </strong>
              </div>
            </div>
          )}

          {info && <Alert tone="info">{info}</Alert>}
          {error && <Alert>{error}</Alert>}

          <div className="hidden gap-3 sm:flex">
            <Button type="submit" disabled={saving || !fullName || !quote}>
              {saving ? "Guardando…" : "Registrar paquete"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/paquetes")}
            >
              Cancelar
            </Button>
          </div>

          {/* Barra fija en móvil (sobre el bottom nav) */}
          <div className="fixed inset-x-0 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-30 border-t border-sky-200/80 bg-white/95 p-3 backdrop-blur-md sm:hidden">
            <Button
              type="submit"
              className="w-full"
              disabled={saving || !fullName || !quote}
            >
              {saving ? "Guardando…" : "Registrar paquete"}
            </Button>
          </div>
        </form>
      </Card>
      <div className="h-20 sm:hidden" />
    </div>
  );
}
