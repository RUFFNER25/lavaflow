"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui";
import { StatusQuickActions } from "@/components/StatusQuickActions";
import { money, formatDate } from "@/lib/format";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/status";
import type { PackageStatus } from "@/lib/types";

export type PackageListItem = {
  id: string;
  code: string;
  weightKg: string | number;
  total: string | number;
  status: PackageStatus | string;
  createdAt: string | Date;
  customer: { fullName: string; dni: string; phone?: string | null };
  washType?: { name: string };
};

export function PackageListCard({
  pkg,
  onUpdated,
}: {
  pkg: PackageListItem;
  onUpdated?: (id: string, status: PackageStatus) => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(pkg.status as PackageStatus);

  useEffect(() => {
    setStatus(pkg.status as PackageStatus);
  }, [pkg.status]);

  return (
    <div className="surface-card rounded-[1.25rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/paquetes/${pkg.id}`} className="min-w-0 active:opacity-80">
          <div className="font-bold text-sky-800">{pkg.code}</div>
          <div className="mt-0.5 truncate font-semibold text-sky-950">
            {pkg.customer.fullName}
          </div>
          <div className="mt-0.5 text-xs font-medium text-sky-600/70">
            DNI {pkg.customer.dni}
            {pkg.customer.phone ? ` · ${pkg.customer.phone}` : ""}
          </div>
        </Link>
        <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-sky-100 pt-3 text-sm">
        {pkg.washType && (
          <span className="font-medium text-sky-800">{pkg.washType.name}</span>
        )}
        <span className="font-medium text-sky-700">
          {Number(pkg.weightKg).toFixed(2)} kg
        </span>
        <span className="ml-auto font-bold text-sky-950">
          {money(Number(pkg.total))}
        </span>
      </div>
      <div className="mt-1 text-[11px] font-medium text-sky-600/60">
        {formatDate(pkg.createdAt)}
      </div>

      <div className="mt-3 border-t border-sky-100 pt-3">
        <StatusQuickActions
          packageId={pkg.id}
          status={status}
          onUpdated={(next) => {
            setStatus(next);
            onUpdated?.(pkg.id, next);
            if (!onUpdated) router.refresh();
          }}
        />
        <Link
          href={`/paquetes/${pkg.id}`}
          className="mt-2 block text-center text-xs font-bold text-sky-600"
        >
          Ver detalle
        </Link>
      </div>
    </div>
  );
}
