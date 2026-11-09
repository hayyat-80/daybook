import { NextResponse, type NextRequest } from "next/server";

import {
  SESSION_COOKIE,
  isAuthConfigured,
  parseCookieHeader,
  verifySessionToken,
} from "@/lib/auth/session";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/login" || pathname === "/register") return true;
  if (pathname.startsWith("/api/auth/login")) return true;
  if (pathname.startsWith("/api/auth/register")) return true;
  if (pathname.startsWith("/api/auth/logout")) return true;
  if (pathname.startsWith("/api/health")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/manifest.webmanifest" || pathname === "/manifest.json") return true;
  if (pathname.startsWith("/icons")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAuthConfigured()) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    if (pathname === "/login" || pathname === "/register") {
      const token = parseCookieHeader(request.headers.get("cookie"), SESSION_COOKIE);
      if (await verifySessionToken(token)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  const token = parseCookieHeader(request.headers.get("cookie"), SESSION_COOKIE);
  if (await verifySessionToken(token)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const secret = process.env.API_SECRET?.trim();
    const provided = request.headers.get("x-api-secret");
    if (secret && provided === secret) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const login = new URL("/login", request.url);
  const next = `${pathname}${request.nextUrl.search}`;
  if (next && next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
