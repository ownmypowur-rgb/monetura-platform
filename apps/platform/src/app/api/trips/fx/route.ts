import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBankOfCanadaRate } from "@/lib/trips/fx";

/**
 * Preview only — shows the member which Bank of Canada rate will apply before
 * they save. The expense routes look the rate up again server-side; a rate
 * sent by the browser is never stored as a Bank of Canada rate.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const currency = (url.searchParams.get("currency") ?? "").toUpperCase();
  const date = url.searchParams.get("date") ?? "";
  if (!/^[A-Z]{3}$/.test(currency) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "currency and date are required" }, { status: 400 });
  }
  if (currency === "CAD") {
    return NextResponse.json({ kind: "cad" });
  }
  const result = await getBankOfCanadaRate(currency, date);
  return NextResponse.json(result);
}
