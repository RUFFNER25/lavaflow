import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { MobileBottomNav, MobileTopBar } from "@/components/MobileNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const tenant = session.tenantId
    ? await prisma.tenant.findUnique({
        where: { id: session.tenantId },
        select: { name: true, logoUrl: true },
      })
    : null;

  return (
    <div className="app-shell min-h-screen lg:flex">
      <Sidebar tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar tenantName={tenant?.name} logoUrl={tenant?.logoUrl} />
        <main className="flex-1 px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pt-5 lg:p-8 lg:pb-8 xl:px-10">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
