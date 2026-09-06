import "server-only";
import { getDb, moneturaCreditUsage, moneturaMembers } from "./index";
import { eq, and, gte, sum } from "drizzle-orm";
import type { Database } from "./index";

/**
 * Either the pooled db or an open transaction — both expose the same `select`.
 * Lets the balance read run inside the lock taken by deductCredit.
 */
type Reader = Pick<Database, "select">;

export type MemberTier = "free" | "community" | "software" | "founder" | "admin";

// Monthly credit limits per membership tier — the single source of truth.
export const TIER_LIMITS: Record<MemberTier, number> = {
  free: 0,
  community: 50,
  software: 100,
  founder: 500,
  admin: 9999,
};

/** Thrown by deductCredit when the member has no credits left this month. */
export const INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS";

function startOfCurrentMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * Net credits consumed this calendar month: debits minus refunds.
 * `tx` lets this run inside an open transaction so the read and the
 * subsequent write see the same locked snapshot.
 */
async function getMonthlyUsed(
  memberId: number,
  tx: Reader = getDb()
): Promise<number> {
  const since = startOfCurrentMonth();
  const [debits, credits] = await Promise.all([
    tx
      .select({ total: sum(moneturaCreditUsage.credits) })
      .from(moneturaCreditUsage)
      .where(
        and(
          eq(moneturaCreditUsage.memberId, memberId),
          eq(moneturaCreditUsage.direction, "debit"),
          gte(moneturaCreditUsage.createdAt, since)
        )
      ),
    tx
      .select({ total: sum(moneturaCreditUsage.credits) })
      .from(moneturaCreditUsage)
      .where(
        and(
          eq(moneturaCreditUsage.memberId, memberId),
          eq(moneturaCreditUsage.direction, "credit"),
          gte(moneturaCreditUsage.createdAt, since)
        )
      ),
  ]);
  const used = Number(debits[0]?.total ?? 0) - Number(credits[0]?.total ?? 0);
  return Math.max(0, used);
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
 * Atomically deducts `credits` (default 1) for a member.
 *
 * The whole check-then-insert runs inside a transaction that first takes a row
 * lock on the member (`SELECT … FOR UPDATE`). Concurrent deductions for the
 * same member therefore serialize on that row and cannot both pass a stale
 * balance check — the previous implementation could overspend under parallel
 * requests. Different members never contend with each other.
 *
 * Throws Error(INSUFFICIENT_CREDITS) when the balance would go negative.
 * Returns the new remaining balance.
 */
export async function deductCredit(
  memberId: number,
  tier: MemberTier,
  reason: string,
  referenceId?: string,
  credits = 1
): Promise<number> {
  const limit = TIER_LIMITS[tier] ?? 0;

  return getDb().transaction(async (tx) => {
    // Serialize concurrent deductions for this member on the member row.
    await tx
      .select({ id: moneturaMembers.id })
      .from(moneturaMembers)
      .where(eq(moneturaMembers.id, memberId))
      .limit(1)
      .for("update");

    const used = await getMonthlyUsed(memberId, tx);
    const remaining = Math.max(0, limit - used);
    if (remaining < credits) {
      throw new Error(INSUFFICIENT_CREDITS);
    }

    const balanceAfter = remaining - credits;
    await tx.insert(moneturaCreditUsage).values({
      memberId,
      credits,
      direction: "debit",
      reason,
      referenceId: referenceId ?? null,
      balanceAfter,
    });

    return balanceAfter;
  });
}

/**
 * Returns credits to a member after a paid operation failed downstream.
 * Written as a "credit" row so the ledger keeps both sides of the story;
 * getMonthlyUsed nets them off. Never throws — a failed refund must not mask
 * the original error that triggered it.
 */
export async function refundCredit(
  memberId: number,
  reason: string,
  referenceId?: string,
  credits = 1
): Promise<void> {
  try {
    const used = await getMonthlyUsed(memberId);
    await getDb().insert(moneturaCreditUsage).values({
      memberId,
      credits,
      direction: "credit",
      reason,
      referenceId: referenceId ?? null,
      balanceAfter: used,
    });
  } catch (err) {
    console.error(
      `[credits] Refund of ${credits} credit(s) to member ${memberId} failed:`,
      err
    );
  }
}

/** Returns credits used this month (for display). */
export async function getMonthlyCredits(memberId: number): Promise<number> {
  return getMonthlyUsed(memberId);
}
