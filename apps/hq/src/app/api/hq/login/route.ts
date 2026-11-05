import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@monetura/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  safeEqual,
} from "@/lib/session";

export const dynamic = "force-dynamic";

function safeNext(value: FormDataEntryValue | null): string {
  // Only same-site relative paths; no protocol-relative or absolute redirects.
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) {
    return value;
  }
  return "/";
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const next = safeNext(form.get("next"));
  const fail = (code: string) => {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", code);
    if (next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url, 303);
  };

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!checkRateLimit(`hq-login:${ip}`, 8, 15 * 60 * 1000).allowed) return fail("rate");

  const expected = process.env["HQ_OWNER_PASSWORD"];
  const secret = process.env["HQ_SESSION_SECRET"];
  if (!expected || !secret) return fail("config");

  const password = form.get("password");
  if (typeof password !== "string" || !safeEqual(password, expected)) return fail("invalid");

  const res = NextResponse.redirect(new URL(next, req.url), 303);
  res.cookies.set(SESSION_COOKIE, await createSessionToken(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && req.nextUrl.protocol === "https:",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
