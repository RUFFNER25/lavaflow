import { clearSessionCookie, getSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { jsonOk } from "@/lib/api";

export async function POST() {
  const session = await getSession();
  if (session) {
    await audit({
      tenantId: session.tenantId,
      userId: session.id,
      action: "auth.logout",
    });
  }
  await clearSessionCookie();
  return jsonOk({ loggedOut: true });
}
