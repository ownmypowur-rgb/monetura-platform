import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getTotalCommissionsThisMonth,
  getAllTimeCommissions,
  getPendingCommissionsTotal,
  checkReferralMilestone,
  getAllCommissions,
} from "@monetura/db";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberId = session.user.memberId;

  try {
    const [commissionsThisMonth, commissionsAllTime, pendingAmount, milestone, allCommissions] =
      await Promise.all([
        getTotalCommissionsThisMonth(memberId),
        getAllTimeCommissions(memberId),
        getPendingCommissionsTotal(memberId),
        checkReferralMilestone(memberId),
        getAllCommissions(memberId),
      ]);

    // Return last 10 commissions for dashboard preview
    const recentCommissions = allCommissions.slice(-10).reverse().map((c) => ({
      id: Number(c.id),
      amountCents: c.amountCents,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      referredMemberId: c.referredMemberId ? Number(c.referredMemberId) : null,
    }));

    return NextResponse.json({
      commissionsThisMonth,
      commissionsAllTime,
      pendingAmount,
      referralCount: milestone.referralCount,
      milestoneReached: milestone.milestoneReached,
      recentCommissions,
    });
  } catch (err) {
    console.error("[member/earnings] error:", err);
    return NextResponse.json({ error: "Failed to load earnings data" }, { status: 500 });
  }
}
