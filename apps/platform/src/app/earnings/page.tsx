import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getDb,
  getAllCommissions,
  getTotalCommissionsThisMonth,
  getAllTimeCommissions,
  getPendingCommissionsTotal,
  checkReferralMilestone,
  getOrCreateAffiliateLink,
  getClickCountThisMonth,
  moneturaMembers,
  moneturaAffiliateClicks,
} from "@monetura/db";
import { eq, count } from "drizzle-orm";
import { EarningsClient, type CommissionRow, type ReferredMember } from "./EarningsClient";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberId = session.user.memberId;
  const memberTier = session.user.memberTier;
  const db = getDb();

  const link = await getOrCreateAffiliateLink(memberId);

  const [
    commissionsThisMonth,
    commissionsAllTime,
    pendingAmount,
    milestone,
    rawCommissions,
    clicksThisMonth,
    referredMembersRaw,
    clicksAllTimeRows,
  ] = await Promise.all([
    getTotalCommissionsThisMonth(memberId),
    getAllTimeCommissions(memberId),
    getPendingCommissionsTotal(memberId),
    checkReferralMilestone(memberId),
    getAllCommissions(memberId),
    getClickCountThisMonth(link.id),
    db
      .select({
        id: moneturaMembers.id,
        name: moneturaMembers.name,
        status: moneturaMembers.status,
        createdAt: moneturaMembers.createdAt,
      })
      .from(moneturaMembers)
      .where(eq(moneturaMembers.referredBy, link.code))
      .orderBy(moneturaMembers.createdAt),
    db
      .select({ total: count() })
      .from(moneturaAffiliateClicks)
      .where(eq(moneturaAffiliateClicks.linkId, link.id)),
  ]);

  const clicksAllTime = Number(clicksAllTimeRows[0]?.total ?? 0);

  const commissions: CommissionRow[] = rawCommissions
    .slice()
    .reverse()
    .map((c) => ({
      id: Number(c.id),
      amountCents: c.amountCents,
      status: c.status as CommissionRow["status"],
      createdAt: c.createdAt.toISOString(),
      referredMemberId: c.referredMemberId ? Number(c.referredMemberId) : null,
    }));

  const referredMembers: ReferredMember[] = referredMembersRaw.map((m) => ({
    id: Number(m.id),
    name: m.name,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <EarningsClient
      commissionsThisMonth={commissionsThisMonth}
      commissionsAllTime={commissionsAllTime}
      pendingAmount={pendingAmount}
      referralCount={milestone.referralCount}
      milestoneReached={milestone.milestoneReached}
      affiliateCode={link.code}
      trackingUrl={link.destinationUrl}
      clicksThisMonth={clicksThisMonth}
      clicksAllTime={clicksAllTime}
      commissions={commissions}
      referredMembers={referredMembers}
      memberTier={memberTier}
    />
  );
}
