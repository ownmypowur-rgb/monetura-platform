import "server-only";
import { getDb, moneturaCreditUsage } from "./index";
import { eq, and, gte, sum } from "drizzle-orm";

export type MemberTier = "free" | "community" | "software" | "founder" | "admin";

// Monthly credit limits per membership tier
const TIER_LIMITS: Record<MemberTier, number> = {
  free: 0,
  community: 50,
  software: 100,
  founder: 500,
  admin: 9999,
};

function startOfCurrentMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

/** Total credits USED (debited) this calendar month for a member. */
async function getMonthlyUsed(memberId: number): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ total: sum(moneturaCreditUsage.credits) })
    .from(moneturaCreditUsage)
    .where(
      and(
        eq(moneturaCreditUsage.memberId, memberId),
        eq(moneturaCreditUsage.direction, "debit"),
        gte(moneturaCreditUsage.createdAt, startOfCurrentMonth())
      )
    );
  return Number(rows[0]?.total ?? 0);
}

/** Returns credits remaining this month (never negative). */
export async function getRemainingCredits(
  memberId: number,
  tier: MemberTier
): Promise<number> {
  const limit = TIER_LIMITS[tier] ?? 0;
  const used = await getMonthlyUsed(memberId);
  return Math.max(0, limit - used);
}

/**
 * Deducts 1 credit for a member.
 * Throws an error if the member has no credits remaining.
 * Returns the new remaining balance.
 */
export async function deductCredit(
  memberId: number,
  tier: MemberTier,
  reason: string,
  referenceId?: string
): Promise<number> {
  const remaining = await getRemainingCredits(memberId, tier);
  if (remaining <= 0) {
    throw new Error("INSUFFICIENT_CREDITS");
  }
  const balanceAfter = remaining - 1;
  await getDb().insert(moneturaCreditUsage).values({
    memberId,
    credits: 1,
    direction: "debit",
    reason,
    referenceId: referenceId ?? null,
    balanceAfter,
  });
  return balanceAfter;
}

/** Returns credits used this month (for display). */
export async function getMonthlyCredits(memberId: number): Promise<number> {
  return getMonthlyUsed(memberId);
}
