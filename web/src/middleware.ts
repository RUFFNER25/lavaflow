import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC = [
  "/login",
  "/api/auth/login",
  "/api/health",
  "/api/public",
];
const INTERNAL_PREFIX = "/api/internal";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  if (pathname.startsWith(INTERNAL_PREFIX)) {
    return NextResponse.next();
  }

  // PDF con key interna
  if (pathname.match(/^\/api\/packages\/[^/]+\/pdf$/) && req.nextUrl.searchParams.get("key")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("lav_session")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.length < 32) throw new Error("missing secret");
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Sesión inválida" }, { status: 401 });
    }
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("lav_session");
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
