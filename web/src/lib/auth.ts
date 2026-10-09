import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { Role } from "@/lib/types";

const COOKIE_NAME = "lav_session";
const SESSION_DAYS = 7;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string | null;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET debe tener al menos 32 caracteres");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const user: SessionUser = {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as Role,
      tenantId: (payload.tenantId as string) || null,
    };

    const dbUser = await prisma.user.findFirst({
      where: { id: user.id, active: true },
      select: { id: true },
    });
    if (!dbUser) return null;

    return user;
  } catch {
    return null;
  }
}

export async function requireSession(roles?: Role[]) {
  const session = await getSession();
  if (!session) {
    throw new AuthError("No autenticado", 401);
  }
  if (roles && !roles.includes(session.role)) {
    throw new AuthError("Sin permiso", 403);
  }
  return session;
}

export async function requireTenantSession(roles?: Role[]) {
  const session = await requireSession(roles);
  if (!session.tenantId && session.role !== "SUPER_ADMIN") {
    throw new AuthError("Usuario sin lavandería asignada", 403);
  }
  return session as SessionUser & { tenantId: string };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
