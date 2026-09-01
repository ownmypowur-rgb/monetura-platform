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

// ── Publishing ───────────────────────────────────────────────────────────────

export type BundleSocialPlatform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "tiktok";

const BUNDLE_TYPE_MAP: Record<BundleSocialPlatform, string> = {
  instagram: "INSTAGRAM",
  facebook: "FACEBOOK",
  linkedin: "LINKEDIN",
  tiktok: "TIKTOK",
};

export interface BundlePublishInput {
  memberId: number;
  title: string;
  /** Per-platform caption/text. Only platforms present are published. */
  content: Partial<Record<BundleSocialPlatform, string>>;
  /** When set, the post is scheduled for this time; otherwise published now. */
  scheduleAt?: Date | null;
}

export type BundlePublishResult =
  | { ok: true; bundlePostId: string | null }
  | { ok: false; error: string };

/**
 * Creates a post on bundle.social for the member's team.
 *
 * Contract per bundle.social API reference (POST /api/v1/post/):
 *   { teamId, title, postDate (ISO), status: "SCHEDULED", socialAccountTypes,
 *     data: { INSTAGRAM: { type: "POST", text }, FACEBOOK: { text }, … } }
 * An immediate publish is a SCHEDULED post dated now. See DECISIONS.md
 * [Sprint 4] for what still needs a live-key verification pass.
 */
export async function publishBundlePost(
  input: BundlePublishInput
): Promise<BundlePublishResult> {
  const db = getDb();

  const rows = await db
    .select({ bundleTeamId: moneturaBundleTeams.bundleTeamId })
    .from(moneturaBundleTeams)
    .where(eq(moneturaBundleTeams.memberId, input.memberId))
    .limit(1);

  if (!rows[0]) {
    return {
      ok: false,
      error:
        "No connected social accounts. Connect your accounts in Settings → Social first.",
    };
  }

  const platforms = (
    Object.keys(input.content) as BundleSocialPlatform[]
  ).filter((p) => Boolean(input.content[p]));

  if (platforms.length === 0) {
    return { ok: false, error: "No social platform content to publish." };
  }

  const data: Record<string, { type?: string; text: string }> = {};
  for (const platform of platforms) {
    const text = input.content[platform] ?? "";
    if (platform === "instagram") {
      data[BUNDLE_TYPE_MAP[platform]] = { type: "POST", text };
    } else {
      data[BUNDLE_TYPE_MAP[platform]] = { text };
    }
  }

  const postDate = (input.scheduleAt ?? new Date()).toISOString();

  let response: Response;
  try {
    response = await fetch(`${BUNDLE_API}/post/`, {
      method: "POST",
      headers: getBundleHeaders(),
      body: JSON.stringify({
        teamId: rows[0].bundleTeamId,
        title: input.title,
        postDate,
        status: "SCHEDULED",
        socialAccountTypes: platforms.map((p) => BUNDLE_TYPE_MAP[p]),
        data,
      }),
    });
  } catch (err) {
    return {
      ok: false,
      error: `bundle.social unreachable: ${err instanceof Error ? err.message : "network error"}`,
    };
  }

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      error: `bundle.social post creation failed: ${response.status} ${text.slice(0, 500)}`,
    };
  }

  const result = (await response.json().catch(() => null)) as {
    id?: string;
  } | null;

  return { ok: true, bundlePostId: result?.id ?? null };
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
