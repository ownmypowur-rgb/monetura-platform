import "server-only";
import { and, count, desc, eq, gte, sum } from "drizzle-orm";
import {
  getDb,
  moneturaMembers,
  moneturaSocialAccounts,
  moneturaContentPosts,
  moneturaChallenges,
  moneturaChallengeEntries,
} from "./index";

/** Count of active founder-tier members — used for real "spots remaining". */
export async function getActiveFounderCount(): Promise<number> {
  const rows = await getDb()
    .select({ c: count() })
    .from(moneturaMembers)
    .where(
      and(
        eq(moneturaMembers.membershipTier, "founder"),
        eq(moneturaMembers.status, "active")
      )
    );
  return Number(rows[0]?.c ?? 0);
}

/**
 * Sum of stored follower counts across the member's social accounts.
 * Returns null when there is nothing to sum — callers should render "—".
 */
export async function getMemberTotalReach(
  memberId: number
): Promise<number | null> {
  const rows = await getDb()
    .select({ total: sum(moneturaSocialAccounts.followerCount) })
    .from(moneturaSocialAccounts)
    .where(eq(moneturaSocialAccounts.memberId, memberId));

  const total = rows[0]?.total;
  if (total === null || total === undefined) return null;
  const n = Number(total);
  return n > 0 ? n : null;
}

function startOfCurrentMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

/** Member's posts published this calendar month. */
export async function getPublishedPostCountThisMonth(
  memberId: number
): Promise<number> {
  const rows = await getDb()
    .select({ c: count() })
    .from(moneturaContentPosts)
    .where(
      and(
        eq(moneturaContentPosts.authorId, memberId),
        eq(moneturaContentPosts.status, "published"),
        gte(moneturaContentPosts.publishedAt, startOfCurrentMonth())
      )
    );
  return Number(rows[0]?.c ?? 0);
}

export interface RecentPostSummary {
  id: number;
  title: string;
  status: string;
  createdAt: Date;
  platforms: string[];
}

/** Member's most recent posts (default 3) with the platforms they target. */
export async function getRecentPosts(
  memberId: number,
  limit = 3
): Promise<RecentPostSummary[]> {
  const rows = await getDb()
    .select({
      id: moneturaContentPosts.id,
      title: moneturaContentPosts.title,
      status: moneturaContentPosts.status,
      createdAt: moneturaContentPosts.createdAt,
      instagramCaption: moneturaContentPosts.instagramCaption,
      facebookCaption: moneturaContentPosts.facebookCaption,
      linkedinCaption: moneturaContentPosts.linkedinCaption,
      tiktokCaption: moneturaContentPosts.tiktokCaption,
      blogTitle: moneturaContentPosts.blogTitle,
      magazineTitle: moneturaContentPosts.magazineTitle,
    })
    .from(moneturaContentPosts)
    .where(eq(moneturaContentPosts.authorId, memberId))
    .orderBy(desc(moneturaContentPosts.id))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    createdAt: row.createdAt,
    platforms: [
      row.instagramCaption ? "Instagram" : null,
      row.facebookCaption ? "Facebook" : null,
      row.linkedinCaption ? "LinkedIn" : null,
      row.tiktokCaption ? "TikTok" : null,
      row.blogTitle ? "Blog" : null,
      row.magazineTitle ? "Magazine" : null,
    ].filter((p): p is string => p !== null),
  }));
}

export interface ActiveChallenge {
  id: number;
  title: string;
  description: string | null;
  creditReward: number;
  endDate: Date | null;
  entriesCount: number;
}

/** The currently active community challenge (latest if several), or null. */
export async function getActiveChallenge(): Promise<ActiveChallenge | null> {
  const db = getDb();

  const challenges = await db
    .select({
      id: moneturaChallenges.id,
      title: moneturaChallenges.title,
      description: moneturaChallenges.description,
      creditReward: moneturaChallenges.creditReward,
      endDate: moneturaChallenges.endDate,
    })
    .from(moneturaChallenges)
    .where(eq(moneturaChallenges.status, "active"))
    .orderBy(desc(moneturaChallenges.id))
    .limit(1);

  const challenge = challenges[0];
  if (!challenge) return null;

  const entryRows = await db
    .select({ c: count() })
    .from(moneturaChallengeEntries)
    .where(eq(moneturaChallengeEntries.challengeId, challenge.id));

  return {
    ...challenge,
    entriesCount: Number(entryRows[0]?.c ?? 0),
  };
}
