import "server-only";
import { eq, and, gte, sum, count } from "drizzle-orm";
import {
  getDb,
  moneturaAffiliateClicks,
  moneturaAffiliateLinks,
  moneturaCommissions,
  moneturaMembers,
} from "./index";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommissionType =
  | "referral_signup"
  | "referral_purchase"
  | "subscription_renewal";

export type CommissionRecord = typeof moneturaCommissions.$inferSelect;

// ---------------------------------------------------------------------------
// Commission rates by tier
// ---------------------------------------------------------------------------

const COMMISSION_RATES: Record<string, number> = {
  founder: 0.25,
  early_adopter_platinum: 0.2,
  early_adopter_gold: 0.2,
  early_adopter_silver: 0.2,
  member: 0.15,
  // Map live schema tiers
  free: 0.15,
  community: 0.15,
  software: 0.2,
  admin: 0.25,
};

export function getCommissionRate(memberTier: string): number {
  return COMMISSION_RATES[memberTier] ?? 0.15;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function startOfCurrentMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

// ---------------------------------------------------------------------------
// Click tracking
// ---------------------------------------------------------------------------

export async function recordClick(
  affiliateLinkId: number,
  ipAddress: string | null,
  userAgent: string | null,
  referrer: string | null
): Promise<void> {
  await getDb().insert(moneturaAffiliateClicks).values({
    linkId: affiliateLinkId,
    ipAddress,
    userAgent,
    referrer,
  });
}

// ---------------------------------------------------------------------------
// Commission recording
// ---------------------------------------------------------------------------

/**
 * Inserts a commission record.
 *
 * @param memberId          - Affiliate member earning the commission
 * @param _type             - Commission type (stored for display; schema uses amountCents)
 * @param amountCad         - Gross transaction amount in CAD
 * @param commissionRatePct - Commission percentage (e.g. 25 for 25%)
 * @param _description      - Human-readable note (reserved for future schema field)
 * @param referenceId       - New member ID or sale ID
 *
 * Commission amount stored = amountCad × (commissionRatePct / 100), in cents.
 */
export async function recordCommission(
  memberId: number,
  _type: CommissionType,
  amountCad: number,
  commissionRatePct: number,
  _description: string,
  referenceId: number | null
): Promise<void> {
  const commissionAmountCad = amountCad * (commissionRatePct / 100);
  await getDb().insert(moneturaCommissions).values({
    affiliateMemberId: memberId,
    referredMemberId: referenceId,
    amountCents: Math.round(commissionAmountCad * 100),
    status: "pending",
  });
}

// ---------------------------------------------------------------------------
// Commission queries
// ---------------------------------------------------------------------------

/**
 * Total CAD from confirmed (approved) + pending commissions this calendar month.
 */
export async function getTotalCommissionsThisMonth(memberId: number): Promise<number> {
  const since = startOfCurrentMonth();

  const [approvedRows, pendingRows] = await Promise.all([
    getDb()
      .select({ total: sum(moneturaCommissions.amountCents) })
      .from(moneturaCommissions)
      .where(
        and(
          eq(moneturaCommissions.affiliateMemberId, memberId),
          eq(moneturaCommissions.status, "approved"),
          gte(moneturaCommissions.createdAt, since)
        )
      ),
    getDb()
      .select({ total: sum(moneturaCommissions.amountCents) })
      .from(moneturaCommissions)
      .where(
        and(
          eq(moneturaCommissions.affiliateMemberId, memberId),
          eq(moneturaCommissions.status, "pending"),
          gte(moneturaCommissions.createdAt, since)
        )
      ),
  ]);

  return (
    (Number(approvedRows[0]?.total ?? 0) + Number(pendingRows[0]?.total ?? 0)) /
    100
  );
}

/**
 * Total CAD earned all time from confirmed (approved + paid) commissions.
 */
export async function getAllTimeCommissions(memberId: number): Promise<number> {
  const [approvedRows, paidRows] = await Promise.all([
    getDb()
      .select({ total: sum(moneturaCommissions.amountCents) })
      .from(moneturaCommissions)
      .where(
        and(
          eq(moneturaCommissions.affiliateMemberId, memberId),
          eq(moneturaCommissions.status, "approved")
        )
      ),
    getDb()
      .select({ total: sum(moneturaCommissions.amountCents) })
      .from(moneturaCommissions)
      .where(
        and(
          eq(moneturaCommissions.affiliateMemberId, memberId),
          eq(moneturaCommissions.status, "paid")
        )
      ),
  ]);

  return (
    (Number(approvedRows[0]?.total ?? 0) + Number(paidRows[0]?.total ?? 0)) /
    100
  );
}

/**
 * Returns all pending commission records for a member, newest first.
 */
export async function getPendingCommissions(memberId: number): Promise<CommissionRecord[]> {
  return getDb()
    .select()
    .from(moneturaCommissions)
    .where(
      and(
        eq(moneturaCommissions.affiliateMemberId, memberId),
        eq(moneturaCommissions.status, "pending")
      )
    )
    .orderBy(moneturaCommissions.createdAt);
}

/**
 * Returns total pending commission amount in CAD.
 */
export async function getPendingCommissionsTotal(memberId: number): Promise<number> {
  const rows = await getDb()
    .select({ total: sum(moneturaCommissions.amountCents) })
    .from(moneturaCommissions)
    .where(
      and(
        eq(moneturaCommissions.affiliateMemberId, memberId),
        eq(moneturaCommissions.status, "pending")
      )
    );
  return Number(rows[0]?.total ?? 0) / 100;
}

/**
 * Returns all commission records for a member, newest first.
 */
export async function getAllCommissions(memberId: number): Promise<CommissionRecord[]> {
  return getDb()
    .select()
    .from(moneturaCommissions)
    .where(eq(moneturaCommissions.affiliateMemberId, memberId))
    .orderBy(moneturaCommissions.createdAt);
}

// ---------------------------------------------------------------------------
// Referral milestone
// ---------------------------------------------------------------------------

/**
 * Counts active members referred by this member's affiliate code.
 * milestoneReached = true when referralCount >= 3 (earns free membership).
 */
export async function checkReferralMilestone(
  memberId: number
): Promise<{ referralCount: number; milestoneReached: boolean }> {
  // Get affiliate code for this member
  const links = await getDb()
    .select({ code: moneturaAffiliateLinks.code })
    .from(moneturaAffiliateLinks)
    .where(
      and(
        eq(moneturaAffiliateLinks.memberId, memberId),
        eq(moneturaAffiliateLinks.isActive, true)
      )
    )
    .limit(1);

  if (!links[0]) return { referralCount: 0, milestoneReached: false };

  const code = links[0].code;

  // Count active members who signed up via this code
  const rows = await getDb()
    .select({ total: count() })
    .from(moneturaMembers)
    .where(
      and(
        eq(moneturaMembers.referredBy, code),
        eq(moneturaMembers.status, "active")
      )
    );

  const referralCount = Number(rows[0]?.total ?? 0);
  return { referralCount, milestoneReached: referralCount >= 3 };
}
