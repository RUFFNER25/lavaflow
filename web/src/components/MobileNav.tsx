"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";

const links = [
  { href: "/dashboard", label: "Inicio", icon: "⌂" },
  { href: "/paquetes/nuevo", label: "Nuevo", icon: "+" },
  { href: "/paquetes", label: "Lista", icon: "☰" },
  { href: "/configuracion", label: "Ajustes", icon: "⚙" },
];

export function MobileTopBar({
  tenantName,
  logoUrl,
}: {
  tenantName?: string;
  logoUrl?: string | null;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-sky-200/70 bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark name={tenantName} logoUrl={logoUrl} size="sm" />
          <div className="min-w-0">
            <div className="truncate font-display text-base font-semibold text-sky-950">
              {tenantName || (
                <>
                  Lava<span className="text-sky-500">Flow</span>
                </>
              )}
            </div>
            <p className="truncate text-[11px] font-semibold text-sky-600/70">
              Lavandería
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="shrink-0 rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 ring-1 ring-sky-100 active:bg-sky-100"
        >
          Salir
        </button>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sky-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 py-1.5">
        {links.map((l) => {
          let active = pathname === l.href;
          if (l.href === "/paquetes") {
            active =
              pathname === "/paquetes" ||
              (pathname.startsWith("/paquetes/") &&
                !pathname.startsWith("/paquetes/nuevo"));
          } else if (l.href === "/dashboard") {
            active = pathname === "/dashboard";
          } else if (l.href !== "/paquetes/nuevo") {
            active = pathname === l.href || pathname.startsWith(l.href + "/");
          }
          const isNew = l.href === "/paquetes/nuevo";
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex min-h-[3.4rem] flex-col items-center justify-center rounded-2xl px-1 py-1.5 transition ${
                active
                  ? "bg-sky-50 text-sky-800"
                  : "text-sky-600/70 active:bg-sky-50"
              }`}
            >
              <span
                className={`flex size-8 items-center justify-center rounded-xl text-base font-bold ${
                  isNew
                    ? "bg-gradient-to-b from-sky-500 to-blue-600 text-white shadow-sm"
                    : active
                      ? "bg-sky-100 text-sky-800"
                      : "bg-transparent"
                }`}
              >
                {l.icon}
              </span>
              <span className="mt-0.5 text-[10px] font-bold tracking-wide">
                {l.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
