import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { audit } from "@/lib/audit";
import { handleApiError, jsonOk } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });

    if (!user || !user.active) {
      return Response.json({ ok: false, error: "Credenciales inválidas" }, { status: 401 });
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      return Response.json({ ok: false, error: "Credenciales inválidas" }, { status: 401 });
    }

    const session = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as import("@/lib/types").Role,
      tenantId: user.tenantId,
    };

    const token = await createSessionToken(session);
    await setSessionCookie(token);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await audit({
      tenantId: user.tenantId,
      userId: user.id,
      action: "auth.login",
    });

    return jsonOk({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
