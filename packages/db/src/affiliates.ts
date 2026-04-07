import "server-only";
import { eq, and, gte, count } from "drizzle-orm";
import {
  getDb,
  moneturaAffiliateLinks,
  moneturaAffiliateClicks,
  moneturaMembers,
} from "./index";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AffiliateLink = typeof moneturaAffiliateLinks.$inferSelect;

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

export function generateAffiliateCode(memberId: number): string {
  return `MTR-${String(memberId).padStart(5, "0")}`;
}

// ---------------------------------------------------------------------------
// CRUD helpers
// ---------------------------------------------------------------------------

function startOfCurrentMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export async function createAffiliateLink(
  memberId: number,
  label = "general"
): Promise<AffiliateLink> {
  const code = generateAffiliateCode(memberId);
  const destinationUrl = `https://monetura.com?ref=${code}`;

  await getDb().insert(moneturaAffiliateLinks).values({
    memberId,
    code,
    label,
    destinationUrl,
    isActive: true,
  });

  const rows = await getDb()
    .select()
    .from(moneturaAffiliateLinks)
    .where(eq(moneturaAffiliateLinks.code, code))
    .limit(1);

  // Should always exist after insert; throw to surface bugs early
  if (!rows[0]) throw new Error(`Failed to fetch affiliate link after insert for member ${memberId}`);
  return rows[0];
}

export async function getAffiliateLinkByMemberId(memberId: number): Promise<AffiliateLink | null> {
  const rows = await getDb()
    .select()
    .from(moneturaAffiliateLinks)
    .where(
      and(
        eq(moneturaAffiliateLinks.memberId, memberId),
        eq(moneturaAffiliateLinks.isActive, true)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function getAffiliateLinkByCode(code: string): Promise<AffiliateLink | null> {
  const rows = await getDb()
    .select()
    .from(moneturaAffiliateLinks)
    .where(eq(moneturaAffiliateLinks.code, code))
    .limit(1);
  return rows[0] ?? null;
}

export async function getOrCreateAffiliateLink(memberId: number): Promise<AffiliateLink> {
  const existing = await getAffiliateLinkByMemberId(memberId);
  if (existing) return existing;

  try {
    return await createAffiliateLink(memberId);
  } catch {
    // Race condition — another request won; re-fetch
    const row = await getAffiliateLinkByMemberId(memberId);
    if (row) return row;
    throw new Error(`Failed to get or create affiliate link for member ${memberId}`);
  }
}

// ---------------------------------------------------------------------------
// Analytics helpers
// ---------------------------------------------------------------------------

export async function getClickCountThisMonth(linkId: number): Promise<number> {
  const rows = await getDb()
    .select({ total: count() })
    .from(moneturaAffiliateClicks)
    .where(
      and(
        eq(moneturaAffiliateClicks.linkId, linkId),
        gte(moneturaAffiliateClicks.clickedAt, startOfCurrentMonth())
      )
    );
  return Number(rows[0]?.total ?? 0);
}

export async function getReferralCount(code: string): Promise<number> {
  const rows = await getDb()
    .select({ total: count() })
    .from(moneturaMembers)
    .where(eq(moneturaMembers.referredBy, code));
  return Number(rows[0]?.total ?? 0);
}
