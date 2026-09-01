"use client";

import Link from "next/link";
import {
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
  ArrowRightIcon,
  SparkleIcon,
} from "./icons";

export interface RecentPostItem {
  id: number;
  title: string;
  status: string;
  /** ISO string — serialized by the server component. */
  createdAt: string;
  platforms: string[];
}

function PlatformIcon({ platform }: { platform: string }) {
  const props = { size: 14 as const, style: { color: "#C4A882" as const } };
  switch (platform) {
    case "Instagram":
      return <InstagramIcon {...props} />;
    case "Facebook":
      return <FacebookIcon {...props} />;
    case "TikTok":
      return <TikTokIcon {...props} />;
    default:
      return null;
  }
}

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function statusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case "published":
      return { label: "Published", color: "#6FCF6F" };
    case "publishing":
      return { label: "Publishing…", color: "#D4A853" };
    case "failed":
      return { label: "Failed", color: "#FCA5A5" };
    case "archived":
      return { label: "Archived", color: "#8B6E52" };
    default:
      return { label: "Draft", color: "#D4A853" };
  }
}

interface RecentPostsCardProps {
  posts: RecentPostItem[];
  className?: string;
}

export function RecentPostsCard({ posts, className = "" }: RecentPostsCardProps) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: "#2C2420",
        border: "1px solid #4A3728",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(90deg, #D4A853 0%, #C17A4A 40%, transparent 100%)" }}
      />

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm tracking-[0.15em] uppercase mb-1" style={{ color: "#C4A882" }}>
              Your Content
            </p>
            <h2
              className="text-2xl font-light"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              Recent Posts
            </h2>
          </div>
          <Link
            href="/posts"
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "#D4A853", fontFamily: "var(--font-heading)", textDecoration: "none" }}
          >
            View all <ArrowRightIcon size={12} />
          </Link>
        </div>

        {posts.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "#1A0F0A", border: "1px solid #4A3728" }}
          >
            <p
              className="text-lg font-light mb-2"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              Your first post will appear here
            </p>
            <p className="text-sm mb-5" style={{ color: "#C4A882" }}>
              Upload a photo, add a note, and let the AI craft your captions.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold tracking-[0.1em] uppercase"
              style={{
                background: "linear-gradient(135deg, #D4A853 0%, #C4973D 100%)",
                color: "#2C2420",
                fontFamily: "var(--font-heading)",
                textDecoration: "none",
              }}
            >
              <SparkleIcon size={14} />
              Create Your First Post
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const status = statusLabel(post.status);
              return (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}`}
                  className="block rounded-xl p-4"
                  style={{
                    background: "#1A0F0A",
                    border: "1px solid #4A3728",
                    textDecoration: "none",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1">
                          {post.platforms.map((p) => (
                            <PlatformIcon key={p} platform={p} />
                          ))}
                        </div>
                        <span className="text-xs truncate" style={{ color: "#C4A882" }}>
                          {post.platforms.join(" + ") || "No platforms"}
                        </span>
                      </div>
                      <p
                        className="text-base font-medium truncate"
                        style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
                      >
                        {post.title}
                      </p>
                    </div>

                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-sm font-medium leading-none mb-1" style={{ color: status.color }}>
                        {status.label}
                      </p>
                      <p className="text-[11px]" style={{ color: "#C4A882" }}>
                        {relativeDate(post.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
