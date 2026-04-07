"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type Platform = "instagram" | "facebook" | "linkedin" | "tiktok" | "blog" | "magazine";
type PostStatus = "draft" | "published" | "archived";

export interface PostDetailData {
  id: number;
  title: string;
  status: PostStatus;
  contentType: string;
  aiCreditsUsed: number;
  createdAt: string;
  publishedAt: string | null;
  instagramCaption: string | null;
  instagramHashtags: string[] | null;
  facebookCaption: string | null;
  linkedinCaption: string | null;
  tiktokCaption: string | null;
  blogTitle: string | null;
  blogBody: string | null;
  blogExcerpt: string | null;
  magazineTitle: string | null;
  magazineIntro: string | null;
}

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: PostStatus) {
  const map: Record<PostStatus, { label: string; bg: string; color: string }> = {
    draft: { label: "Draft", bg: "rgba(212,168,83,0.15)", color: C.gold },
    published: { label: "Published", bg: "rgba(74,181,74,0.15)", color: "#6FCF6F" },
    archived: { label: "Archived", bg: "rgba(139,110,82,0.2)", color: C.mid },
  };
  return map[status];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "tiktok", label: "TikTok" },
  { id: "blog", label: "Blog" },
  { id: "magazine", label: "Magazine" },
];

// ── Main component ────────────────────────────────────────────────────────────

export function PostDetail({ post }: { post: PostDetailData }) {
  const [activeTab, setActiveTab] = useState<Platform>("instagram");
  const badge = statusBadge(post.status);
  const isPublished = post.status === "published";

  function getPlatformContent(platform: Platform): string {
    switch (platform) {
      case "instagram": {
        const tags = (post.instagramHashtags ?? [])
          .map((t) => `#${t.replace(/^#/, "")}`)
          .join(" ");
        return [post.instagramCaption, tags].filter(Boolean).join("\n\n");
      }
      case "facebook": return post.facebookCaption ?? "";
      case "linkedin": return post.linkedinCaption ?? "";
      case "tiktok": return post.tiktokCaption ?? "";
      case "blog":
        return [
          post.blogTitle ? `# ${post.blogTitle}` : "",
          post.blogExcerpt ? `*${post.blogExcerpt}*` : "",
          post.blogBody ?? "",
        ].filter(Boolean).join("\n\n");
      case "magazine":
        return [
          post.magazineTitle ? `# ${post.magazineTitle}` : "",
          post.magazineIntro ?? "",
        ].filter(Boolean).join("\n\n");
    }
  }

  const platformHasContent = (p: Platform): boolean => Boolean(getPlatformContent(p));

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 lg:px-8 py-4"
        style={{ background: C.bg, borderBottom: `1px solid ${C.mocha}` }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href="/posts"
            style={{ color: C.canyon, display: "flex", alignItems: "center", flexShrink: 0 }}
            aria-label="Back to posts"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12,19 5,12 12,5" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <p
              className="text-base font-semibold truncate"
              style={{ color: C.cream, fontFamily: "var(--font-heading)" }}
            >
              {post.title}
            </p>
            <p className="text-xs" style={{ color: C.mid }}>
              {formatDate(post.createdAt)}
            </p>
          </div>
          <span
            style={{
              background: badge.bg,
              color: badge.color,
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 20,
              flexShrink: 0,
            }}
          >
            {badge.label}
          </span>
        </div>
      </div>

      <div className="px-4 lg:px-8 pt-5 pb-28 lg:pb-10 max-w-3xl mx-auto space-y-4">
        {/* Stats row (placeholder) */}
        <div
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: "👁", label: "Total Reach", value: "—" },
            { icon: "❤️", label: "Total Likes", value: "—" },
            { icon: "💰", label: "Earned", value: "—" },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              style={{
                background: C.card,
                border: `1px solid ${C.mocha}`,
                borderRadius: 12,
                padding: "12px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 20 }}>{icon}</p>
              <p className="text-lg font-semibold" style={{ color: C.gold, fontFamily: "var(--font-heading)" }}>
                {value}
              </p>
              <p className="text-xs" style={{ color: C.mid }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Content tabs */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.mocha}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {/* Tab bar */}
          <div
            className="flex overflow-x-auto"
            style={{ borderBottom: `1px solid ${C.mocha}`, background: C.panel }}
          >
            {PLATFORMS.map((p) => {
              const isActive = activeTab === p.id;
              const hasContent = platformHasContent(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveTab(p.id)}
                  disabled={!hasContent}
                  style={{
                    padding: "10px 14px",
                    fontSize: 12,
                    fontFamily: "var(--font-heading)",
                    whiteSpace: "nowrap",
                    background: isActive ? C.card : "transparent",
                    color: isActive ? C.gold : hasContent ? C.sand : C.mid,
                    borderBottom: isActive ? `2px solid ${C.gold}` : "2px solid transparent",
                    border: "none",
                    cursor: hasContent ? "pointer" : "default",
                    opacity: hasContent ? 1 : 0.4,
                    transition: "all 0.15s",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Content area */}
          <div className="p-4">
            {isPublished && (
              <div
                className="mb-3 px-3 py-2 rounded-lg text-xs"
                style={{
                  background: "rgba(74,181,74,0.08)",
                  border: "1px solid rgba(74,181,74,0.2)",
                  color: "#6FCF6F",
                }}
              >
                Published — editing disabled
              </div>
            )}
            <pre
              style={{
                color: C.sand,
                fontSize: 13.5,
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "inherit",
                margin: 0,
              }}
            >
              {getPlatformContent(activeTab) || (
                <span style={{ color: C.mid, fontStyle: "italic" }}>
                  No content generated for this platform
                </span>
              )}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/create"
            style={{
              flex: 1,
              textAlign: "center",
              padding: "12px",
              borderRadius: 12,
              border: `1px solid ${C.mocha}`,
              color: C.sand,
              fontFamily: "var(--font-heading)",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Re-generate
          </Link>
          {post.status !== "published" && (
            <button
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 12,
                background: `linear-gradient(135deg, ${C.canyon}, ${C.gold})`,
                border: "none",
                color: C.bg,
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
