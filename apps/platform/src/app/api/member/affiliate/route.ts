import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getOrCreateAffiliateLink,
  getClickCountThisMonth,
  getReferralCount,
} from "@monetura/db";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberId = session.user.memberId;

  try {
    const link = await getOrCreateAffiliateLink(memberId);
    const [clicksThisMonth, referralCount] = await Promise.all([
      getClickCountThisMonth(link.id),
      getReferralCount(link.code),
    ]);

    return NextResponse.json({
      code: link.code,
      trackingUrl: link.destinationUrl,
      clicksThisMonth,
      referralCount,
    });
  } catch (err) {
    console.error("[member/affiliate] error:", err);
    return NextResponse.json({ error: "Failed to load affiliate data" }, { status: 500 });
  }
}
