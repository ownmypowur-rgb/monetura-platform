import "server-only";
import { randomBytes } from "node:crypto";
import { and, count, desc, eq, gte, isNull } from "drizzle-orm";
import { getDb, moneturaWaitlist } from "./index";

export type WaitlistRow = typeof moneturaWaitlist.$inferSelect;

export interface WaitlistSignupInput {
  firstName: string;
  email: string;
  consentText: string;
  consentVersion: string;
  consentPage: string | null;
  ipHash: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
}

const RESEND_WINDOW_MS = 24 * 60 * 60 * 1000;

function newToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Records a signup. Returns the row and whether a confirmation email should go out.
 * - new address: inserted, send.
 * - already subscribed: name refreshed; send only if no confirmation in the last 24h.
 * - previously unsubscribed: fresh consent recorded, resubscribed, existing token kept
 *   (links in earlier emails keep working), send.
 */
export async function recordWaitlistSignup(
  input: WaitlistSignupInput
): Promise<{ row: WaitlistRow; shouldSend: boolean }> {
  const db = getDb();
  const now = new Date();
  const [existing] = await db
    .select()
    .from(moneturaWaitlist)
    .where(eq(moneturaWaitlist.email, input.email))
    .limit(1);

  if (!existing) {
    await db.insert(moneturaWaitlist).values({
      firstName: input.firstName,
      email: input.email,
      status: "subscribed",
      consentText: input.consentText,
      consentVersion: input.consentVersion,
      consentedAt: now,
      consentPage: input.consentPage,
      ipHash: input.ipHash,
      unsubscribeToken: newToken(),
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      referrer: input.referrer,
    });
    const [row] = await db
      .select()
      .from(moneturaWaitlist)
      .where(eq(moneturaWaitlist.email, input.email))
      .limit(1);
    if (!row) throw new Error("waitlist insert not found");
    return { row, shouldSend: true };
  }

  if (existing.status === "unsubscribed") {
    await db
      .update(moneturaWaitlist)
      .set({
        firstName: input.firstName,
        status: "subscribed",
        consentText: input.consentText,
        consentVersion: input.consentVersion,
        consentedAt: now,
        consentPage: input.consentPage,
        ipHash: input.ipHash,
        unsubscribedAt: null,
        confirmationSentAt: null,
      })
      .where(eq(moneturaWaitlist.id, existing.id));
    return {
      row: { ...existing, firstName: input.firstName, status: "subscribed", unsubscribedAt: null, confirmationSentAt: null },
      shouldSend: true,
    };
  }

  if (existing.firstName !== input.firstName) {
    await db
      .update(moneturaWaitlist)
      .set({ firstName: input.firstName })
      .where(eq(moneturaWaitlist.id, existing.id));
  }
  const recent =
    existing.confirmationSentAt !== null &&
    now.getTime() - existing.confirmationSentAt.getTime() < RESEND_WINDOW_MS;
  return { row: { ...existing, firstName: input.firstName }, shouldSend: !recent };
}

export async function markWaitlistConfirmationSent(id: number): Promise<void> {
  await getDb()
    .update(moneturaWaitlist)
    .set({ confirmationSentAt: new Date() })
    .where(eq(moneturaWaitlist.id, id));
}

/** Idempotent. Returns false when the token is unknown. */
export async function unsubscribeWaitlistByToken(token: string): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const db = getDb();
  const [row] = await db
    .select({ id: moneturaWaitlist.id, status: moneturaWaitlist.status })
    .from(moneturaWaitlist)
    .where(eq(moneturaWaitlist.unsubscribeToken, token))
    .limit(1);
  if (!row) return false;
  if (row.status !== "unsubscribed") {
    await db
      .update(moneturaWaitlist)
      .set({ status: "unsubscribed", unsubscribedAt: new Date() })
      .where(eq(moneturaWaitlist.id, row.id));
  }
  return true;
}

export async function listPendingWaitlistConfirmations(): Promise<WaitlistRow[]> {
  return getDb()
    .select()
    .from(moneturaWaitlist)
    .where(and(eq(moneturaWaitlist.status, "subscribed"), isNull(moneturaWaitlist.confirmationSentAt)))
    .orderBy(moneturaWaitlist.createdAt);
}

export interface WaitlistStats {
  subscribed: number;
  unsubscribed: number;
  lastSevenDays: number;
  pendingConfirmation: number;
}

export async function getWaitlistStats(): Promise<WaitlistStats> {
  const db = getDb();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const n = async (where: ReturnType<typeof eq> | ReturnType<typeof and>) => {
    const [r] = await db.select({ c: count() }).from(moneturaWaitlist).where(where);
    return Number(r?.c ?? 0);
  };
  const [subscribed, unsubscribed, lastSevenDays, pendingConfirmation] = await Promise.all([
    n(eq(moneturaWaitlist.status, "subscribed")),
    n(eq(moneturaWaitlist.status, "unsubscribed")),
    n(gte(moneturaWaitlist.createdAt, since)),
    n(and(eq(moneturaWaitlist.status, "subscribed"), isNull(moneturaWaitlist.confirmationSentAt))),
  ]);
  return { subscribed, unsubscribed, lastSevenDays, pendingConfirmation };
}

/** Newest first. `limit` null returns every row (CSV export). */
export async function listWaitlist(opts: { limit: number | null; offset: number }): Promise<WaitlistRow[]> {
  const q = getDb().select().from(moneturaWaitlist).orderBy(desc(moneturaWaitlist.createdAt));
  return opts.limit === null ? q : q.limit(opts.limit).offset(opts.offset);
}
