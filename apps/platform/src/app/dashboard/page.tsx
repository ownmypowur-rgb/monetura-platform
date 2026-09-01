import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getRemainingCredits,
  getMemberTotalReach,
  getTotalCommissionsThisMonth,
  getPublishedPostCountThisMonth,
  getRecentPosts,
  getActiveChallenge,
  TIER_LIMITS,
} from "@monetura/db";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { MemberTier } from "@/components/dashboard/types";

export const dynamic = "force-dynamic";

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  const diff = date.getTime() - Date.now();
  return diff <= 0 ? 0 : Math.ceil(diff / 86400000);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tier = session.user.memberTier as MemberTier;
  const memberId = session.user.memberId;

  // Every widget gets real data; individual failures degrade to honest empties.
  const [
    creditsRemaining,
    totalReach,
    commissionsCents,
    postsThisMonth,
    recentPosts,
    challenge,
  ] = await Promise.all([
    getRemainingCredits(memberId, tier),
    getMemberTotalReach(memberId).catch(() => null),
    getTotalCommissionsThisMonth(memberId).catch(() => 0),
    getPublishedPostCountThisMonth(memberId).catch(() => 0),
    getRecentPosts(memberId, 3).catch(() => []),
    getActiveChallenge().catch(() => null),
  ]);

  const user = {
    name: session.user.name ?? "Member",
    memberTier: tier,
    founderNumber: session.user.founderNumber,
    creditsRemaining,
    creditsTotal: TIER_LIMITS[tier] ?? 0,
  };

  return (
    <DashboardShell
      user={user}
      stats={{ totalReach, commissionsCents, postsThisMonth }}
      recentPosts={recentPosts.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        platforms: p.platforms,
      }))}
      challenge={
        challenge
          ? {
              title: challenge.title,
              creditReward: challenge.creditReward,
              daysLeft: daysUntil(challenge.endDate),
              entriesCount: challenge.entriesCount,
            }
          : null
      }
    />
  );
}
