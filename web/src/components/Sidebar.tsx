"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";

const links = [
  { href: "/dashboard", label: "Inicio", hint: "Resumen del día" },
  { href: "/paquetes/nuevo", label: "Nuevo paquete", hint: "DNI + peso" },
  { href: "/paquetes", label: "Paquetes", hint: "Buscar y entregar" },
  { href: "/configuracion", label: "Configuración", hint: "Precios y WhatsApp" },
];

export function Sidebar({
  tenantName,
  logoUrl,
}: {
  tenantName?: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden w-[17.5rem] shrink-0 flex-col border-r border-sky-200/80 bg-white/75 backdrop-blur-md lg:flex lg:min-h-screen">
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <BrandMark name={tenantName} logoUrl={logoUrl} size="md" />
          <div className="min-w-0">
            <div className="truncate font-display text-lg font-semibold tracking-tight text-sky-950">
              {tenantName || (
                <>
                  Lava<span className="text-sky-500">Flow</span>
                </>
              )}
            </div>
            <p className="truncate text-xs font-semibold text-sky-600/70">
              Panel de lavandería
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {links.map((l) => {
          const active =
            pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`group rounded-2xl px-3.5 py-2.5 transition duration-200 ${
                active
                  ? "bg-gradient-to-r from-sky-500/15 to-blue-500/10 text-sky-900 ring-1 ring-sky-300/70"
                  : "text-sky-800/75 hover:bg-sky-100/70 hover:text-sky-950"
              }`}
            >
              <div className="text-sm font-bold">{l.label}</div>
              <div
                className={`text-[11px] font-medium ${
                  active
                    ? "text-sky-600"
                    : "text-sky-500/60 group-hover:text-sky-600/80"
                }`}
              >
                {l.hint}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3">
        <div className="mb-3 rounded-2xl bg-sky-50 px-3.5 py-3 text-xs font-medium leading-relaxed text-sky-700/80 ring-1 ring-sky-100">
          Ropa limpia, flujo claro. Registra, lava y avisa por WhatsApp.
        </div>
        <button
          onClick={logout}
          className="w-full rounded-2xl px-3.5 py-2.5 text-left text-sm font-bold text-sky-700/80 transition hover:bg-sky-100 hover:text-sky-950"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
