import { prisma } from "@/lib/prisma";

export async function GET() {
  const started = Date.now();
  let dbOk = false;
  let dbError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "db error";
  }

  const pendingMessages = dbOk
    ? await prisma.messageQueue.count({
        where: { status: { in: ["PENDING", "SENDING", "FAILED"] } },
      })
    : null;

  const status = dbOk ? "ok" : "degraded";

  return Response.json(
    {
      status,
      service: "lavanderia-web",
      version: process.env.npm_package_version || "1.0.0",
      uptimeSec: Math.floor(process.uptime()),
      latencyMs: Date.now() - started,
      checks: {
        database: dbOk ? "ok" : "fail",
        dbError,
        pendingMessages,
      },
      time: new Date().toISOString(),
    },
    { status: dbOk ? 200 : 503 }
  );
}
