import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Explicit public allowlist — everything NOT listed here requires a session.
const PUBLIC_PATHS = new Set([
  "/login",
  "/forgot-password",
  "/set-password",
  "/reset-password",
]);

// Public API endpoints beyond /api/auth/*. Affiliate click tracking must work
// for logged-out visitors — it records the click and sets the referral cookie.
const PUBLIC_API_PATHS = new Set(["/api/affiliate/track"]);

const API_AUTH_PREFIX = "/api/auth";
const SECURE_COOKIE = "__Secure-authjs.session-token";
const INSECURE_COOKIE = "authjs.session-token";

function isAdminPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow NextAuth + auth API routes (register, set-password, …)
  if (pathname.startsWith(API_AUTH_PREFIX)) return NextResponse.next();

  // Explicitly public API endpoints
  if (PUBLIC_API_PATHS.has(pathname)) return NextResponse.next();

  // NextAuth v5 sets one of these two cookie names depending on HTTPS
  const hasSecureCookie = req.cookies.has(SECURE_COOKIE);
  const sessionToken =
    req.cookies.get(SECURE_COOKIE) ?? req.cookies.get(INSECURE_COOKIE);
  const isAuthenticated = !!sessionToken;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && PUBLIC_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !PUBLIC_PATHS.has(pathname)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Defense-in-depth for /admin: verify the JWT and require admin tier.
  // Pages and API routes keep their own auth() checks — this is an extra gate,
  // and only /admin paths pay the cost of JWT verification in middleware.
  if (isAuthenticated && isAdminPath(pathname)) {
    const secret = process.env["NEXTAUTH_SECRET"];
    let isAdmin = false;

    if (secret) {
      try {
        const cookieName = hasSecureCookie ? SECURE_COOKIE : INSECURE_COOKIE;
        const token = await getToken({
          req,
          secret,
          salt: cookieName,
          cookieName,
          secureCookie: hasSecureCookie,
        });
        isAdmin = token?.memberTier === "admin";
      } catch {
        isAdmin = false;
      }
    }

    if (!isAdmin) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
