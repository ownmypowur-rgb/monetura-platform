import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listWaitlist } from "@monetura/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stops spreadsheet formula injection: cells starting with = + - @ (or tab/CR) are prefixed. */
function cell(value: string | null | undefined): string {
  let v = value ?? "";
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return `"${v.replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.memberTier !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await listWaitlist({ limit: null, offset: 0 });
  const header = [
    "first_name", "email", "status", "joined", "confirmation_sent", "unsubscribed",
    "consent_version", "consented_at", "consent_page", "utm_source", "utm_medium", "utm_campaign", "referrer",
  ];
  const iso = (d: Date | null) => (d ? d.toISOString() : "");
  const lines = rows.map((r) =>
    [
      r.firstName, r.email, r.status, iso(r.createdAt), iso(r.confirmationSentAt), iso(r.unsubscribedAt),
      r.consentVersion, iso(r.consentedAt), r.consentPage, r.utmSource, r.utmMedium, r.utmCampaign, r.referrer,
    ].map(cell).join(",")
  );
  const csv = [header.join(","), ...lines].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="monetura-waitlist-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
