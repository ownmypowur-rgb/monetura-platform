import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { loadExportBundle } from "@/lib/trips/export";
import { exportResponse, parseFormat } from "@/lib/trips/export-response";

export const maxDuration = 60;

/** GET /api/trips/export?year=2026&format=pdf|csv|zip — a calendar tax year across all trips. */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId, id: userId, name } = session.user;
  const url = new URL(request.url);
  const format = parseFormat(url.searchParams.get("format"));
  const year = Number(url.searchParams.get("year"));
  if (!format) return NextResponse.json({ error: "format must be pdf, csv or zip" }, { status: 400 });
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "year must be a calendar year" }, { status: 400 });
  }

  const bundle = await loadExportBundle(memberId, name || session.user.email, { kind: "year", year });
  return exportResponse(bundle, format, userId);
}
