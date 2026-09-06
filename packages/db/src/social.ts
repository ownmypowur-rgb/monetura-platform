import "server-only";
import { eq } from "drizzle-orm";
import { getDb, moneturaBundleTeams } from "./index";

const BUNDLE_API = "https://api.bundle.social/api/v1";

function getBundleApiKey(): string {
  const key = process.env["BUNDLE_SOCIAL_API_KEY"];
  if (!key) throw new Error("BUNDLE_SOCIAL_API_KEY environment variable is required");
  return key;
}

function getBundleHeaders(): Record<string, string> {
  return {
    "x-api-key": getBundleApiKey(),
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

/**
 * Public profile URL for a connected account.
 *
 * bundle.social's create-post response returns only an internal post id, and a
 * scheduled post has no permalink at creation time, so there is no live post
 * URL to hand back. The member's own profile/page is the next best destination:
 * the APIs cannot post to personal profiles, so the distribution step is the
 * member re-sharing from their Page or account by hand.
 *
 * Returns null when the handle is unusable (LinkedIn Company Pages and Facebook
 * Pages can surface a display name rather than a URL slug, and guessing a URL
 * that 404s is worse than showing no link).
 */
export function bundleProfileUrl(
  platform: string,
  username: string | null
): string | null {
  const handle = (username ?? "").trim().replace(/^@/, "");
  if (!handle || /\s/.test(handle)) return null;
  const encoded = encodeURIComponent(handle);

  switch (platform) {
    case "instagram":
      return `https://www.instagram.com/${encoded}/`;
    case "tiktok":
      return `https://www.tiktok.com/@${encoded}`;
    case "facebook":
      return `https://www.facebook.com/${encoded}`;
    case "linkedin":
      // A handle here may be a person or a Company Page and the path segment
      // differs (/in/ vs /company/). Send them to their own feed instead of
      // guessing wrong.
      return "https://www.linkedin.com/feed/";
    default:
      return null;
  }
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

export interface BundlePublishMedia {
  /** Publicly fetchable URL of the image (S3 public URL). */
  url: string;
  fileName: string;
  mimeType: string;
}

export interface BundlePublishInput {
  memberId: number;
  title: string;
  /** Per-platform caption/text. Only platforms present are published. */
  content: Partial<Record<BundleSocialPlatform, string>>;
  /** When set, the post is scheduled for this time; otherwise published now. */
  scheduleAt?: Date | null;
  /** Images attached to the post, in display order. */
  media?: BundlePublishMedia[];
}

export type BundlePublishResult =
  | { ok: true; bundlePostId: string | null }
  | { ok: false; error: string };

type BundleUploadResult =
  | { ok: true; uploadId: string }
  | { ok: false; error: string };

/**
 * Uploads one image to bundle.social's media library for the team.
 *
 * Contract per bundle.social API reference (POST /api/v1/upload/): the only
 * multipart endpoint — form fields `teamId` and `file`; returns `{ id, … }`.
 * The returned id is what post payloads reference via `uploadIds`.
 */
async function uploadMediaToBundle(
  teamId: string,
  media: BundlePublishMedia
): Promise<BundleUploadResult> {
  let source: Response;
  try {
    source = await fetch(media.url);
  } catch (err) {
    return {
      ok: false,
      error: `could not fetch ${media.fileName} from storage: ${
        err instanceof Error ? err.message : "network error"
      }`,
    };
  }
  if (!source.ok) {
    return {
      ok: false,
      error: `could not fetch ${media.fileName} from storage: HTTP ${source.status}`,
    };
  }

  const bytes = await source.arrayBuffer();
  const form = new FormData();
  form.append("teamId", teamId);
  form.append("file", new Blob([bytes], { type: media.mimeType }), media.fileName);

  let response: Response;
  try {
    // No Content-Type header here — fetch sets the multipart boundary itself.
    response = await fetch(`${BUNDLE_API}/upload/`, {
      method: "POST",
      headers: { "x-api-key": getBundleApiKey() },
      body: form,
    });
  } catch (err) {
    return {
      ok: false,
      error: `bundle.social unreachable during upload: ${
        err instanceof Error ? err.message : "network error"
      }`,
    };
  }

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      error: `upload of ${media.fileName} rejected: ${response.status} ${text.slice(0, 300)}`,
    };
  }

  const result = (await response.json().catch(() => null)) as { id?: string } | null;
  if (!result?.id) {
    return { ok: false, error: `upload of ${media.fileName} returned no id` };
  }
  return { ok: true, uploadId: result.id };
}

interface BundlePlatformData {
  type?: string;
  text: string;
  uploadIds?: string[];
}

/**
 * Creates a post on bundle.social for the member's team.
 *
 * Contract per bundle.social API reference (POST /api/v1/post/):
 *   { teamId, title, postDate (ISO), status: "SCHEDULED", socialAccountTypes,
 *     data: { INSTAGRAM: { type: "POST", text, uploadIds }, FACEBOOK: { text, uploadIds },
 *             LINKEDIN: { text, uploadIds }, TIKTOK: { type: "IMAGE", text, uploadIds } } }
 * Media is first pushed through POST /api/v1/upload/ (multipart) and the
 * returned ids are referenced via `uploadIds`. An immediate publish is a
 * SCHEDULED post dated now.
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

  const teamId = rows[0].bundleTeamId;

  const platforms = (
    Object.keys(input.content) as BundleSocialPlatform[]
  ).filter((p) => Boolean(input.content[p]));

  if (platforms.length === 0) {
    return { ok: false, error: "No social platform content to publish." };
  }

  // ── Push attached images to bundle.social's media library ─────────────────
  const uploadIds: string[] = [];
  for (const item of input.media ?? []) {
    const uploaded = await uploadMediaToBundle(teamId, item);
    if (!uploaded.ok) {
      return { ok: false, error: `bundle.social media upload failed: ${uploaded.error}` };
    }
    uploadIds.push(uploaded.uploadId);
  }
  const hasMedia = uploadIds.length > 0;

  const data: Record<string, BundlePlatformData> = {};
  for (const platform of platforms) {
    const text = input.content[platform] ?? "";
    const withMedia = hasMedia ? { uploadIds } : {};
    if (platform === "instagram") {
      data[BUNDLE_TYPE_MAP[platform]] = { type: "POST", text, ...withMedia };
    } else if (platform === "tiktok" && hasMedia) {
      // TikTok needs an explicit IMAGE type for photo posts (default is VIDEO).
      data[BUNDLE_TYPE_MAP[platform]] = { type: "IMAGE", text, uploadIds };
    } else {
      data[BUNDLE_TYPE_MAP[platform]] = { text, ...withMedia };
    }
  }

  const postDate = (input.scheduleAt ?? new Date()).toISOString();

  let response: Response;
  try {
    response = await fetch(`${BUNDLE_API}/post/`, {
      method: "POST",
      headers: getBundleHeaders(),
      body: JSON.stringify({
        teamId,
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

interface BundleTeamSocialAccount {
  type: string;
  username: string | null;
  displayName: string | null;
  userDisplayName: string | null;
  deletedAt: string | null;
  channels?: Array<{ name: string | null; username: string | null }>;
}

/**
 * Fetches connected social accounts for a member from bundle.social.
 * Returns an empty array if the member has no bundle team yet.
 *
 * Contract per bundle.social API reference (GET /api/v1/team/{id}): the team
 * object carries its connected accounts in `socialAccounts[]`. Facebook and
 * LinkedIn accounts expose the selectable Pages as `channels[]` and often
 * have a null top-level `username`, so the first channel's handle is used as
 * the display name in that case.
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
    `${BUNDLE_API}/team/${encodeURIComponent(bundleTeamId)}`,
    { headers: getBundleHeaders() }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`bundle.social team fetch failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    socialAccounts?: BundleTeamSocialAccount[];
  };

  return (data.socialAccounts ?? [])
    .filter((account) => !account.deletedAt)
    .map((account) => {
      const channel = account.channels?.[0];
      return {
        platform: PLATFORM_MAP[account.type] ?? account.type.toLowerCase(),
        username:
          account.username ??
          channel?.username ??
          channel?.name ??
          account.displayName ??
          account.userDisplayName ??
          "",
        status: "connected",
      };
    });
}
