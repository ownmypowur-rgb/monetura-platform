import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMemberTrip, parseId } from "@/lib/trips/server";
import { loadExportBundle } from "@/lib/trips/export";
import { exportResponse, parseFormat } from "@/lib/trips/export-response";

export const maxDuration = 60;

/** GET /api/trips/{id}/export?format=pdf|csv|zip — one trip's accountant package. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId, id: userId, name } = session.user;
  const format = parseFormat(new URL(request.url).searchParams.get("format"));
  if (!format) return NextResponse.json({ error: "format must be pdf, csv or zip" }, { status: 400 });

  const tripId = parseId((await params).id);
  const trip = tripId ? await getMemberTrip(memberId, tripId) : null;
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bundle = await loadExportBundle(memberId, name || session.user.email, { kind: "trip", trip });
  return exportResponse(bundle, format, userId);
}
