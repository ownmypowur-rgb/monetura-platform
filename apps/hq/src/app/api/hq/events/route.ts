import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasOwnerSession } from "@/server/auth";
import { toOwnerFeed, toPublicFeed } from "@/server/feed";
import { dbConfigured, readOwnerRows, readPublicRows, tickDemo } from "@/server/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode");

  if (mode === "public") {
    try {
      // Read-only: unauthenticated visitors can never cause writes.
      const feed = toPublicFeed(await readPublicRows());
      return NextResponse.json(feed, {
        headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" },
      });
    } catch (err) {
      console.error("[hq] public feed failed", err);
      return NextResponse.json(toPublicFeed([]), { headers: { "Cache-Control": "no-store" } });
    }
  }

  if (mode === "owner") {
    if (!(await hasOwnerSession())) {
      return NextResponse.json({ error: "Owner session required" }, { status: 401 });
    }
    try {
      const first = await readOwnerRows();
      await tickDemo(first.rows);
      const { rows, decided } = await readOwnerRows();
      return NextResponse.json(toOwnerFeed(rows, decided, dbConfigured() ? "database" : "memory"), {
        headers: { "Cache-Control": "private, no-store" },
      });
    } catch (err) {
      console.error("[hq] owner feed failed", err);
      return NextResponse.json({ error: "Feed unavailable" }, { status: 503 });
    }
  }

  return NextResponse.json({ error: "mode must be owner or public" }, { status: 400 });
}
