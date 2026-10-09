import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { PackageListCard } from "@/components/PackageListCard";
import { money, formatDate } from "@/lib/format";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/status";
import type { PackageStatus } from "@/lib/types";

export default async function DashboardPage() {
  const session = await getSession();
  const tenantId = session!.tenantId!;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayCount, todayRevenue, ready, recent, waConfig, failedMsg] =
    await Promise.all([
      prisma.package.count({
        where: { tenantId, createdAt: { gte: startOfDay } },
      }),
      prisma.package.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfDay },
          status: { not: "CANCELADO" },
        },
        _sum: { total: true },
      }),
      prisma.package.count({
        where: { tenantId, status: "LISTO_PARA_ENTREGA" },
      }),
      prisma.package.findMany({
        where: { tenantId },
        include: { customer: true, washType: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.whatsAppConfig.findUnique({ where: { tenantId } }),
      prisma.messageQueue.count({
        where: { tenantId, status: "FAILED" },
      }),
    ]);

  return (
    <div>
      <PageHeader
        title={`Hola, ${session!.name.split(" ")[0]}`}
        subtitle="Resumen operativo de hoy"
        actions={
          <Link href="/paquetes/nuevo">
            <Button>Registrar paquete</Button>
          </Link>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:mb-6 xl:grid-cols-4 xl:gap-4">
        <Stat title="Paquetes hoy" value={String(todayCount)} />
        <Stat
          title="Ingresos hoy"
          value={money(Number(todayRevenue._sum.total || 0))}
        />
        <Stat title="Listos" value={String(ready)} />
        <Stat
          title="WhatsApp"
          value={waConfig?.connected ? "OK" : "Off"}
          hint={failedMsg ? `${failedMsg} fallidos` : undefined}
        />
      </div>

      <div className="mb-3 flex items-center justify-between px-0.5 lg:mb-4">
        <h2 className="font-display text-lg font-semibold text-sky-950">
          Últimos paquetes
        </h2>
        <Link
          href="/paquetes"
          className="text-sm font-bold text-sky-600 hover:text-sky-700"
        >
          Ver todos
        </Link>
      </div>

      <div className="space-y-3 lg:hidden">
        {recent.map((p) => (
          <PackageListCard key={p.id} pkg={p} />
        ))}
        {recent.length === 0 && (
          <Card>
            <p className="py-8 text-center font-medium text-sky-600/70">
              Aún no hay paquetes. Registra el primero.
            </p>
          </Card>
        )}
      </div>

      <Card className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="soft-table w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-sky-100">
              <tr>
                <th className="pb-2.5 font-bold">Código</th>
                <th className="pb-2.5 font-bold">Cliente</th>
                <th className="pb-2.5 font-bold">Peso</th>
                <th className="pb-2.5 font-bold">Total</th>
                <th className="pb-2.5 font-bold">Estado</th>
                <th className="pb-2.5 font-bold">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.id} className="border-b border-sky-50">
                  <td className="py-3.5">
                    <Link
                      href={`/paquetes/${p.id}`}
                      className="font-bold text-sky-700 hover:text-sky-900 hover:underline"
                    >
                      {p.code}
                    </Link>
                  </td>
                  <td className="py-3.5">
                    <div className="font-semibold text-sky-950">
                      {p.customer.fullName}
                    </div>
                    <div className="text-xs font-medium text-sky-600/70">
                      DNI {p.customer.dni}
                    </div>
                  </td>
                  <td className="py-3.5 font-medium text-sky-800">
                    {Number(p.weightKg).toFixed(2)} kg
                  </td>
                  <td className="py-3.5 font-semibold text-sky-900">
                    {money(Number(p.total))}
                  </td>
                  <td className="py-3.5">
                    <Badge className={STATUS_COLORS[p.status as PackageStatus]}>
                      {STATUS_LABELS[p.status as PackageStatus]}
                    </Badge>
                  </td>
                  <td className="py-3.5 font-medium text-sky-700/70">
                    {formatDate(p.createdAt)}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center font-medium text-sky-600/70"
                  >
                    Aún no hay paquetes. Registra el primero.
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

function Stat({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="relative overflow-hidden !p-3.5 sm:!p-5">
      <div className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-sky-200/40 blur-2xl" />
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-600/70 sm:text-[11px]">
        {title}
      </p>
      <p className="mt-1.5 font-display text-xl font-semibold text-sky-950 sm:mt-2 sm:text-2xl">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs font-semibold text-rose-500">{hint}</p>}
    </Card>
  );
}
