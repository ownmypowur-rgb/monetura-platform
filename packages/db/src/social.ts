import "server-only";
import { eq } from "drizzle-orm";
import { getDb, moneturaBundleTeams } from "./index";

const BUNDLE_API = "https://api.bundle.social/api/v1";

function getBundleHeaders(): Record<string, string> {
  const key = process.env["BUNDLE_SOCIAL_API_KEY"];
  if (!key) throw new Error("BUNDLE_SOCIAL_API_KEY environment variable is required");
  return {
    "x-api-key": key,
    "Content-Type": "application/json",
  };
}

/**
 * Returns the bundle.social teamId for a member.
 * Creates one via the API and persists it if none exists.
 */
export async function getOrCreateBundleTeam(memberId: number): Promise<string> {
  const db = getDb();

  const existing = await db
    .select({ bundleTeamId: moneturaBundleTeams.bundleTeamId })
    .from(moneturaBundleTeams)
    .where(eq(moneturaBundleTeams.memberId, memberId))
    .limit(1);

  if (existing[0]) return existing[0].bundleTeamId;

  const response = await fetch(`${BUNDLE_API}/team/`, {
    method: "POST",
    headers: getBundleHeaders(),
    body: JSON.stringify({ name: `Member ${memberId}` }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`bundle.social team creation failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { id: string };
  const bundleTeamId = data.id;

  try {
    await db.insert(moneturaBundleTeams).values({ memberId, bundleTeamId });
  } catch {
    // Race condition — another request may have won; re-fetch
    const row = await db
      .select({ bundleTeamId: moneturaBundleTeams.bundleTeamId })
      .from(moneturaBundleTeams)
      .where(eq(moneturaBundleTeams.memberId, memberId))
      .limit(1);
    if (row[0]) return row[0].bundleTeamId;
    throw new Error(`Failed to persist bundle team for member ${memberId}`);
  }

  return bundleTeamId;
}

/**
 * Generates a bundle.social hosted portal URL for connecting social accounts.
 * The portal handles OAuth flows for Instagram, Facebook, TikTok, and LinkedIn.
 */
export async function getBundleConnectUrl(
  memberId: number,
  redirectUrl: string
): Promise<string> {
  const teamId = await getOrCreateBundleTeam(memberId);

  const response = await fetch(`${BUNDLE_API}/social-account/create-portal-link`, {
    method: "POST",
    headers: getBundleHeaders(),
    body: JSON.stringify({
      teamId,
      redirectUrl,
      socialAccountTypes: ["INSTAGRAM", "FACEBOOK", "TIKTOK", "LINKEDIN"],
      disableAutoLogin: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`bundle.social portal link creation failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

export interface BundleAccount {
  platform: string;
  username: string;
  status: string;
}

const PLATFORM_MAP: Record<string, string> = {
  INSTAGRAM: "instagram",
  FACEBOOK: "facebook",
  TIKTOK: "tiktok",
  LINKEDIN: "linkedin",
};

/**
 * Fetches connected social accounts for a member from bundle.social.
 * Returns an empty array if the member has no bundle team yet.
 */
export async function getBundleAccounts(memberId: number): Promise<BundleAccount[]> {
  const db = getDb();

  const rows = await db
    .select({ bundleTeamId: moneturaBundleTeams.bundleTeamId })
    .from(moneturaBundleTeams)
    .where(eq(moneturaBundleTeams.memberId, memberId))
    .limit(1);

  if (!rows[0]) return [];

  const { bundleTeamId } = rows[0];

  const response = await fetch(
    `${BUNDLE_API}/social-accounts?teamId=${encodeURIComponent(bundleTeamId)}`,
    { headers: getBundleHeaders() }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`bundle.social accounts fetch failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as Array<{
    type: string;
    username: string;
    status: string;
  }>;

  return data.map((account) => ({
    platform: PLATFORM_MAP[account.type] ?? account.type.toLowerCase(),
    username: account.username,
    status: account.status,
  }));
}
