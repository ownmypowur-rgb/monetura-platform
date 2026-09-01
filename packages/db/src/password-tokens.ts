import "server-only";
import { randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb, moneturaPasswordTokens } from "./index";

export type PasswordTokenPurpose = "set_password" | "reset_password";

const SET_PASSWORD_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RESET_PASSWORD_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Creates a single-use password token for the given ApexCRM users.id.
 * Expiry: 7 days for "set_password" (founder activation), 24h for "reset_password".
 * Returns the raw token to embed in the email link.
 */
export async function createPasswordToken(
  userId: number,
  purpose: PasswordTokenPurpose
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const ttl =
    purpose === "set_password" ? SET_PASSWORD_TTL_MS : RESET_PASSWORD_TTL_MS;

  await getDb().insert(moneturaPasswordTokens).values({
    userId,
    token,
    purpose,
    expiresAt: new Date(Date.now() + ttl),
  });

  return token;
}

/**
 * Consumes a token: if it exists, is unused, and is unexpired, marks it used
 * and returns { userId }. Otherwise returns null.
 */
export async function consumePasswordToken(
  token: string
): Promise<{ userId: number } | null> {
  const db = getDb();

  const rows = await db
    .select({
      id: moneturaPasswordTokens.id,
      userId: moneturaPasswordTokens.userId,
    })
    .from(moneturaPasswordTokens)
    .where(
      and(
        eq(moneturaPasswordTokens.token, token),
        isNull(moneturaPasswordTokens.usedAt),
        gt(moneturaPasswordTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // Guard against a concurrent consumer: only one UPDATE wins the used_at write.
  const result = await db
    .update(moneturaPasswordTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(moneturaPasswordTokens.id, row.id),
        isNull(moneturaPasswordTokens.usedAt)
      )
    );

  const header = result as unknown as [{ affectedRows: number }];
  const affected = Array.isArray(header) ? header[0]?.affectedRows ?? 1 : 1;
  if (affected === 0) return null;

  return { userId: row.userId };
}
