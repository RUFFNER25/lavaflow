"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Input } from "@/components/ui";
import { BrandMark } from "@/components/BrandMark";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@lavanderia.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState<{
    name: string;
    logoUrl: string | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/public/branding")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setBrand(json.data);
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "No se pudo iniciar sesión");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -left-20 top-10 size-72 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-8 size-80 rounded-full bg-blue-300/25 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <BrandMark
              name={brand?.name}
              logoUrl={brand?.logoUrl}
              size="lg"
            />
          </div>
          <div className="font-display text-3xl font-semibold tracking-tight text-sky-950 sm:text-4xl">
            {brand?.name || (
              <>
                Lava<span className="text-sky-500">Flow</span>
              </>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-sky-700/70">
            Gestión suave y clara para tu lavandería
          </p>
        </div>

        <Card className="!rounded-[1.6rem]">
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Correo"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {error && <Alert>{error}</Alert>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
