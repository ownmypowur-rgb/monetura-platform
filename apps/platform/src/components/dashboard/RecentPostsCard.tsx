"use client";

import { InstagramIcon, FacebookIcon, TikTokIcon, ArrowRightIcon } from "./icons";

interface Post {
  title: string;
  platforms: string[];
  reach: string;
  earned: string;
  reachScore: number; // 0-100 for bar
  earnedLabel: string;
}

const POSTS: Post[] = [
  {
    title: "Sunset in Santorini",
    platforms: ["Instagram"],
    reach: "4,200",
    earned: "$180",
    reachScore: 33,
    earnedLabel: "CAD",
  },
  {
    title: "Hidden Gems of Tokyo",
    platforms: ["Facebook", "Instagram"],
    reach: "8,100",
    earned: "$340",
    reachScore: 65,
    earnedLabel: "CAD",
  },
  {
    title: "Ski Season in Whistler",
    platforms: ["Instagram", "Facebook", "TikTok"],
    reach: "12,547",
    earned: "$720",
    reachScore: 100,
    earnedLabel: "CAD",
  },
];

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

interface RecentPostsCardProps {
  className?: string;
}

export function RecentPostsCard({ className = "" }: RecentPostsCardProps) {
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
              Performance
            </p>
            <h2
              className="text-2xl font-light"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              Recent Posts
            </h2>
          </div>
          <button
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
          >
            View all <ArrowRightIcon size={12} />
          </button>
        </div>

        <div className="space-y-3">
          {POSTS.map((post, i) => (
            <div
              key={post.title}
              className="rounded-xl p-4"
              style={{
                background: "#1A0F0A",
                border: "1px solid #4A3728",
              }}
            >
              {/* Post header row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  {/* Rank */}
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs tracking-widest"
                      style={{ color: "#C4A882" }}
                    >
                      #{i + 1}
                    </span>
                    {/* Platform icons */}
                    <div className="flex items-center gap-1">
                      {post.platforms.map((p) => (
                        <PlatformIcon key={p} platform={p} />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: "#C4A882" }}>
                      {post.platforms.join(" + ")}
                    </span>
                  </div>
                  <p
                    className="text-base font-medium truncate"
                    style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
                  >
                    {post.title}
                  </p>
                </div>

                {/* Earned */}
                <div className="text-right ml-3 flex-shrink-0">
                  <p
                    className="text-xl font-light leading-none"
                    style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
                  >
                    {post.earned}
                  </p>
                  <p className="text-[10px]" style={{ color: "#C4A882" }}>
                    {post.earnedLabel}
                  </p>
                </div>
              </div>

              {/* Reach + progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: "#C4A882" }}>
                    Reach
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#E8DCCB" }}
                  >
                    {post.reach}
                  </span>
                </div>
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: "#3D2E26" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${post.reachScore}%`,
                      background:
                        post.reachScore === 100
                          ? "linear-gradient(90deg, #D4A853 0%, #FBF5ED 100%)"
                          : "linear-gradient(90deg, #4A3728 0%, #D4A853 100%)",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
