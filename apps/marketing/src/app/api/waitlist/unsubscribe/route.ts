import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, getClientIp, unsubscribeWaitlistByToken } from "@monetura/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/waitlist/unsubscribe?token=… — used by the unsubscribe page's button and
 * by mail clients' one-click unsubscribe (List-Unsubscribe-Post). Idempotent. Answers
 * 200 either way, so tokens can't be probed; `ok` tells the page which message to show.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const rl = checkRateLimit(`waitlist-unsub:${getClientIp(request)}`, 30, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }
  const token = request.nextUrl.searchParams.get("token") ?? "";
  try {
    const ok = await unsubscribeWaitlistByToken(token);
    return NextResponse.json({ ok });
  } catch (err) {
    console.error("[waitlist] unsubscribe failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
