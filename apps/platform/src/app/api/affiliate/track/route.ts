import { NextResponse } from "next/server";
import { getDb, moneturaAffiliateClicks, getAffiliateLinkByCode } from "@monetura/db";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "mtr_ref";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
const FALLBACK_URL = "https://monetura.com";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.redirect(FALLBACK_URL, { status: 301 });
  }

  // Look up the affiliate link
  let link: Awaited<ReturnType<typeof getAffiliateLinkByCode>>;
  try {
    link = await getAffiliateLinkByCode(code);
  } catch (err) {
    console.error("[affiliate/track] DB lookup error:", err);
    return NextResponse.redirect(FALLBACK_URL, { status: 301 });
  }

  const destination = link?.destinationUrl ?? FALLBACK_URL;

  // Build redirect response and set referral cookie
  const response = NextResponse.redirect(destination, { status: 301 });
  response.cookies.set(COOKIE_NAME, code, {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    httpOnly: false, // needs to be readable client-side at registration
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // Log click — fire and forget, never delay the redirect
  if (link) {
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null;
    const userAgent = request.headers.get("user-agent");
    const referrer = request.headers.get("referer");

    void getDb()
      .insert(moneturaAffiliateClicks)
      .values({
        linkId: link.id,
        ipAddress,
        userAgent,
        referrer,
      })
      .catch((err: unknown) => {
        console.error("[affiliate/track] click log error:", err);
      });
  }

  return response;
}
