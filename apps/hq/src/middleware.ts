import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./lib/session";

/**
 * Lightweight cookie gate. No database or mysql2 here (Edge runtime).
 * Public: /tour, /login, /api/hq/login, and /api/hq/events, which enforces owner
 * access itself per its `mode` parameter. Everything else needs an owner session.
 */
const PUBLIC_PATHS = new Set(["/tour", "/login", "/api/hq/login", "/api/hq/events"]);

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const ok = await verifySessionToken(
    req.cookies.get(SESSION_COOKIE)?.value,
    process.env["HQ_SESSION_SECRET"],
  );
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Owner session required" }, { status: 401 });
  }
  const login = new URL("/login", req.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
