import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getRemainingCredits } from "@monetura/db";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { MemberTier } from "@/components/dashboard/types";

export const dynamic = "force-dynamic";

const TIER_TOTALS: Record<MemberTier, number> = {
  free: 0,
  community: 50,
  software: 100,
  founder: 500,
  admin: 9999,
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tier = session.user.memberTier as MemberTier;
  const memberId = session.user.memberId;
  const creditsRemaining = await getRemainingCredits(memberId, tier);

  const user = {
    name: session.user.name ?? "Member",
    memberTier: tier,
    founderNumber: session.user.founderNumber,
    creditsRemaining,
    creditsTotal: TIER_TOTALS[tier] ?? 0,
  };

  return <DashboardShell user={user} />;
}
