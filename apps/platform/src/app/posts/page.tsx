import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getDb, moneturaContentPosts } from "@monetura/db";
import { eq, and, lt, desc, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

// ── Brand colours ─────────────────────────────────────────────────────────────

const C = {
  bg: "#130D0A",
  card: "#2C2420",
  mocha: "#4A3728",
  gold: "#D4A853",
  goldDark: "#C4973D",
  cream: "#FBF5ED",
  sand: "#E8DCCB",
  canyon: "#C17A4A",
  mid: "#8B6E52",
  panel: "#1A0F0A",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "draft" | "published" | "archived";
type PostStatus = "draft" | "published" | "archived";

const VALID_STATUSES: StatusFilter[] = ["all", "draft", "published", "archived"];

const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: PostStatus) {
  const map: Record<PostStatus, { label: string; bg: string; color: string }> = {
    draft: { label: "Draft", bg: "rgba(212,168,83,0.15)", color: C.gold },
    published: { label: "Published", bg: "rgba(74,181,74,0.15)", color: "#6FCF6F" },
    archived: { label: "Archived", bg: "rgba(139,110,82,0.2)", color: C.mid },
  };
  return map[status] ?? map.draft;
}

function contentTypeEmoji(type: string): string {
  const map: Record<string, string> = {
    article: "📝",
    update: "🔄",
    announcement: "📢",
    lesson: "🎓",
  };
  return map[type] ?? "📝";
}

function platformsFromRow(row: {
  instagramCaption: string | null;
  facebookCaption: string | null;
  linkedinCaption: string | null;
  tiktokCaption: string | null;
  blogTitle: string | null;
  magazineTitle: string | null;
}): string[] {
  return [
    row.instagramCaption ? "IG" : null,
    row.facebookCaption ? "FB" : null,
    row.linkedinCaption ? "LI" : null,
    row.tiktokCaption ? "TT" : null,
    row.blogTitle ? "Blog" : null,
    row.magazineTitle ? "Mag" : null,
  ].filter((x): x is string => x !== null);
}

function relativeDate(d: Date): string {
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PostsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const rawStatus = typeof params.status === "string" ? params.status : "all";
  const statusFilter: StatusFilter = VALID_STATUSES.includes(rawStatus as StatusFilter)
    ? (rawStatus as StatusFilter)
    : "all";
  const cursor = typeof params.cursor === "string" ? Number(params.cursor) : undefined;

  const { memberId } = session.user;
  const db = getDb();

  // Build conditions
  type Condition = Parameters<typeof and>[0];
  const conditions: Condition[] = [eq(moneturaContentPosts.authorId, memberId)];
  if (statusFilter !== "all") conditions.push(eq(moneturaContentPosts.status, statusFilter));
  if (cursor && cursor > 0) conditions.push(lt(moneturaContentPosts.id, cursor));

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(moneturaContentPosts)
      .where(and(...conditions))
      .orderBy(desc(moneturaContentPosts.id))
      .limit(PAGE_SIZE + 1),
    db
      .select({ total: count() })
      .from(moneturaContentPosts)
      .where(
        statusFilter === "all"
          ? eq(moneturaContentPosts.authorId, memberId)
          : and(eq(moneturaContentPosts.authorId, memberId), eq(moneturaContentPosts.status, statusFilter))
      ),
  ]);

  const hasMore = rows.length > PAGE_SIZE;
  const posts = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const nextCursor = hasMore ? (posts[posts.length - 1]?.id ?? null) : null;
  const total = Number(countRows[0]?.total ?? 0);

  // Filter tab definitions
  const filterTabs: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Published", value: "published" },
    { label: "Drafts", value: "draft" },
    { label: "Archived", value: "archived" },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 lg:px-8 py-5"
        style={{ background: C.bg, borderBottom: `1px solid ${C.mocha}` }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/dashboard"
              style={{ color: C.canyon, display: "flex", alignItems: "center" }}
              aria-label="Back to dashboard"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12,19 5,12 12,5" />
              </svg>
            </Link>
            <h1
              className="text-2xl font-light tracking-[0.12em]"
              style={{ color: C.cream, fontFamily: "var(--font-heading)" }}
            >
              Your Posts
            </h1>
            <span
              className="ml-auto text-sm"
              style={{ color: C.mid }}
            >
              {total} post{total !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-sm ml-8" style={{ color: C.mid }}>
            All your AI-generated content
          </p>
        </div>
      </div>

      <div className="px-4 lg:px-8 pt-5 pb-28 lg:pb-10 max-w-3xl mx-auto">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <Link
                key={tab.value}
                href={tab.value === "all" ? "/posts" : `/posts?status=${tab.value}`}
                style={{
                  padding: "6px 16px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontFamily: "var(--font-heading)",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  background: isActive ? C.gold : "transparent",
                  border: `1px solid ${isActive ? C.gold : C.mocha}`,
                  color: isActive ? C.bg : C.sand,
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Empty state */}
        {posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: C.panel, border: `1px solid ${C.mocha}` }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.mid} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <p className="text-lg font-light mb-1" style={{ color: C.sand, fontFamily: "var(--font-heading)" }}>
              No posts yet
            </p>
            <p className="text-sm mb-6" style={{ color: C.mid }}>
              {statusFilter === "all"
                ? "Create your first AI-generated post"
                : `No ${statusFilter} posts`}
            </p>
            {statusFilter === "all" && (
              <Link
                href="/create"
                style={{
                  padding: "10px 24px",
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${C.canyon}, ${C.gold})`,
                  color: C.bg,
                  fontFamily: "var(--font-heading)",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                Create your first post
              </Link>
            )}
          </div>
        )}

        {/* Post cards */}
        {posts.length > 0 && (
          <div className="space-y-3">
            {posts.map((post) => {
              const badge = statusBadge(post.status);
              const platforms = platformsFromRow(post);
              const caption = (post.instagramCaption ?? "").slice(0, 100);
              const emoji = contentTypeEmoji(post.contentType);

              return (
                <div
                  key={post.id}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.mocha}`,
                    borderRadius: 16,
                    padding: "16px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                  }}
                >
                  {/* Top row */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: C.panel, border: `1px solid ${C.mocha}` }}
                    >
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold truncate"
                        style={{ color: C.cream, fontFamily: "var(--font-heading)", fontSize: 15 }}
                      >
                        {post.title}
                      </p>
                      <p className="text-xs" style={{ color: C.mid }}>
                        {relativeDate(post.createdAt)}
                        {post.contentType !== "article" && ` · ${post.contentType}`}
                      </p>
                    </div>
                    {/* Status badge */}
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 9px",
                        borderRadius: 20,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Caption preview */}
                  {caption && (
                    <p
                      className="text-sm mb-3 leading-relaxed"
                      style={{ color: C.sand }}
                    >
                      {caption}{caption.length === 100 ? "…" : ""}
                    </p>
                  )}

                  {/* Platform chips */}
                  {platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {platforms.map((p) => (
                        <span
                          key={p}
                          style={{
                            background: C.panel,
                            border: `1px solid ${C.mocha}`,
                            color: C.mid,
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats row (placeholder) */}
                  <div className="flex gap-4 mb-3">
                    {[
                      { icon: "👁", label: "Reach", value: "—" },
                      { icon: "❤️", label: "Likes", value: "—" },
                      { icon: "💰", label: "Earned", value: "—" },
                    ].map(({ icon, label, value }) => (
                      <div key={label} className="flex items-center gap-1">
                        <span style={{ fontSize: 12 }}>{icon}</span>
                        <span style={{ color: C.mid, fontSize: 12 }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/posts/${post.id}`}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        padding: "8px",
                        borderRadius: 10,
                        background: "transparent",
                        border: `1px solid ${C.mocha}`,
                        color: C.sand,
                        fontFamily: "var(--font-heading)",
                        fontSize: 13,
                        textDecoration: "none",
                      }}
                    >
                      View
                    </Link>
                    {post.status !== "published" && (
                      <Link
                        href="/create"
                        style={{
                          flex: 1,
                          textAlign: "center",
                          padding: "8px",
                          borderRadius: 10,
                          background: `linear-gradient(135deg, ${C.canyon}, ${C.gold})`,
                          border: "none",
                          color: C.bg,
                          fontFamily: "var(--font-heading)",
                          fontWeight: 600,
                          fontSize: 13,
                          textDecoration: "none",
                        }}
                      >
                        Re-publish
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {nextCursor && (
          <div className="mt-6 flex justify-center">
            <Link
              href={`/posts?status=${statusFilter}&cursor=${nextCursor}`}
              style={{
                padding: "10px 28px",
                borderRadius: 12,
                border: `1px solid ${C.mocha}`,
                color: C.sand,
                fontFamily: "var(--font-heading)",
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              Load more
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
