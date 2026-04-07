"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { MemberTier } from "@/types/next-auth";

// ── Upload helpers ────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"] as const;
type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

function isAllowedMimeType(type: string): type is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(type);
}

interface PresignResponse {
  uploadUrl: string;
  mediaUploadId: number;
  publicUrl: string;
}

interface ConfirmResponse {
  success: boolean;
  publicUrl: string;
}

async function uploadFile(file: File): Promise<string> {
  if (!isAllowedMimeType(file.type)) {
    throw new Error(`Unsupported type: ${file.type}. Use JPEG, PNG, or WebP.`);
  }

  // 1. Get presigned URL
  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
  });
  if (!presignRes.ok) {
    const err = (await presignRes.json()) as { error?: string };
    throw new Error(err.error ?? "Failed to get upload URL");
  }
  const { uploadUrl, mediaUploadId, publicUrl } = (await presignRes.json()) as PresignResponse;

  // 2. PUT file directly to S3
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!putRes.ok) {
    throw new Error("Failed to upload to storage");
  }

  // 3. Confirm upload
  const confirmRes = await fetch("/api/upload/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mediaUploadId }),
  });
  if (!confirmRes.ok) {
    throw new Error("Failed to confirm upload");
  }
  (await confirmRes.json()) as ConfirmResponse;

  return publicUrl;
}

// ── Types ────────────────────────────────────────────────────────────────────

type ExperienceType =
  | "travel"
  | "dining"
  | "lifestyle"
  | "fitness"
  | "business"
  | "event";

type Platform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "tiktok"
  | "blog"
  | "magazine";

interface GeneratedContent {
  instagramCaption: string;
  instagramHashtags: string[];
  facebookCaption: string;
  linkedinCaption: string;
  tiktokCaption: string;
  blogTitle: string;
  blogBody: string;
  blogExcerpt: string;
  magazineTitle: string;
  magazineIntro: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EXPERIENCE_TYPES: { type: ExperienceType; label: string; icon: string }[] = [
  { type: "travel", label: "Travel", icon: "✈" },
  { type: "dining", label: "Dining", icon: "🍽" },
  { type: "lifestyle", label: "Lifestyle", icon: "◈" },
  { type: "fitness", label: "Fitness", icon: "⚡" },
  { type: "business", label: "Business", icon: "◆" },
  { type: "event", label: "Event", icon: "✦" },
];

const PLATFORMS: { id: Platform; label: string; icon: string; charLimit: number }[] = [
  { id: "instagram", label: "Instagram", icon: "IG", charLimit: 2200 },
  { id: "facebook", label: "Facebook", icon: "FB", charLimit: 63206 },
  { id: "linkedin", label: "LinkedIn", icon: "LI", charLimit: 3000 },
  { id: "tiktok", label: "TikTok", icon: "TT", charLimit: 2200 },
  { id: "blog", label: "Blog", icon: "✍", charLimit: 50000 },
  { id: "magazine", label: "Magazine", icon: "◈", charLimit: 50000 },
];

const LOADING_MESSAGES = [
  "Analysing your experience...",
  "Crafting your story...",
  "Optimising for each platform...",
  "Adding finishing touches...",
  "Almost ready...",
];

// ── Brand colours ────────────────────────────────────────────────────────────
const C = {
  bg: "#130D0A",
  card: "#2C2420",
  cardBorder: "#4A3728",
  gold: "#D4A853",
  goldDark: "#C4973D",
  mocha: "#C4A882",
  canyon: "#E8DCCB",
  cream: "#FBF5ED",
  sidebar: "#1A0F0A",
  terracotta: "#C17A4A",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function BackArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function CreditsIndicator({ remaining }: { remaining: number }) {
  const color = remaining === 0 ? C.terracotta : remaining <= 10 ? "#E8A44A" : C.gold;
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
      style={{ background: "rgba(212,168,83,0.08)", border: `1px solid rgba(212,168,83,0.2)`, color }}
    >
      <span>⬡</span>
      <span style={{ fontFamily: "var(--font-heading)" }}>
        {remaining} credit{remaining !== 1 ? "s" : ""} remaining
      </span>
    </div>
  );
}

// ── Platform Preview helpers ──────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();
}

function deriveHandle(name: string): string {
  const derived = name.toLowerCase().replace(/\s+/g, ".");
  return derived || "your.handle";
}

function AvatarCircle({ name, size = 36 }: { name: string; size?: number }) {
  const initials = getInitials(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#2C2420",
        fontSize: Math.round(size * 0.36),
        fontWeight: 700,
        flexShrink: 0,
        fontFamily: "var(--font-heading)",
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
}

interface PhotoAreaProps {
  locationName: string;
  photoUrl: string | null;
  aspectRatio: "square" | "vertical" | "horizontal";
}

function PhotoArea({ locationName, photoUrl, aspectRatio }: PhotoAreaProps) {
  const paddingMap: Record<PhotoAreaProps["aspectRatio"], string> = {
    square: "100%",
    vertical: "177.78%",
    horizontal: "56.25%",
  };

  if (photoUrl) {
    return (
      <div style={{ position: "relative", paddingBottom: paddingMap[aspectRatio], overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt="post preview"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        paddingBottom: paddingMap[aspectRatio],
        position: "relative",
        background: "linear-gradient(135deg, #2C2420 0%, #4A3728 100%)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,83,0.4)" strokeWidth="1.4">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        {locationName && (
          <p style={{ color: C.mocha, fontSize: 12, textAlign: "center", padding: "0 12px" }}>{locationName}</p>
        )}
      </div>
    </div>
  );
}

// ── Instagram Preview ─────────────────────────────────────────────────────────

interface PlatformPreviewProps {
  content: GeneratedContent;
  memberName: string;
  handle: string;
  locationName: string;
  photoUrl: string | null;
}

function InstagramPreview({ content, memberName, handle, locationName, photoUrl }: PlatformPreviewProps) {
  const hashtags = content.instagramHashtags.map((t) => `#${t.replace(/^#/, "")}`).join(" ");
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: "min(300px, 100%)",
          border: "2px solid rgba(212,168,83,0.2)",
          borderRadius: 24,
          overflow: "hidden",
          background: "#1a1a1a",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid #2a2a2a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AvatarCircle name={memberName} size={30} />
            <div>
              <p style={{ color: "#fff", fontSize: 12, fontWeight: 600, lineHeight: 1 }}>@{handle}</p>
            </div>
          </div>
          <span style={{ color: "#888", fontSize: 16, letterSpacing: 2 }}>···</span>
        </div>

        {/* Photo */}
        <PhotoArea locationName={locationName} photoUrl={photoUrl} aspectRatio="square" />

        {/* Actions + caption */}
        <div style={{ padding: "8px 12px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ display: "flex", gap: 14 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 3 }}>2,847 likes</p>
          <p style={{ color: "#fff", fontSize: 12, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600 }}>@{handle}</span>{" "}
            {content.instagramCaption.slice(0, 120)}
            {content.instagramCaption.length > 120 ? "…" : ""}
          </p>
          {hashtags && (
            <p style={{ color: "#4b8df8", fontSize: 11, marginTop: 4 }}>
              {hashtags.slice(0, 100)}
            </p>
          )}
          <p style={{ color: "#888", fontSize: 11, marginTop: 5 }}>Just now</p>
        </div>
      </div>
    </div>
  );
}

// ── Facebook Preview ──────────────────────────────────────────────────────────

function FacebookPreview({ content, memberName, photoUrl }: PlatformPreviewProps) {
  return (
    <div
      style={{
        background: "#18191a",
        borderRadius: 10,
        border: "1px solid #3a3b3c",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 10px" }}>
        <AvatarCircle name={memberName} size={40} />
        <div>
          <p style={{ color: "#e4e6eb", fontSize: 14, fontWeight: 600 }}>{memberName}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <p style={{ color: "#b0b3b8", fontSize: 12 }}>Just now</p>
            <span style={{ color: "#b0b3b8", fontSize: 12 }}>·</span>
            {/* Globe icon */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b0b3b8" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Post text */}
      <p style={{ color: "#e4e6eb", fontSize: 14, lineHeight: 1.6, padding: "0 14px 12px" }}>
        {content.facebookCaption.slice(0, 200)}
        {content.facebookCaption.length > 200 ? "…" : ""}
      </p>

      {/* Photo — flush to edges */}
      <PhotoArea locationName="" photoUrl={photoUrl} aspectRatio="horizontal" />

      {/* Reaction bar */}
      <div style={{ display: "flex", borderTop: "1px solid #3a3b3c", padding: "2px 0" }}>
        {(
          [
            { emoji: "👍", label: "Like" },
            { emoji: "💬", label: "Comment" },
            { emoji: "↗️", label: "Share" },
          ] as const
        ).map((a) => (
          <div
            key={a.label}
            style={{
              flex: 1,
              color: "#b0b3b8",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 0",
            }}
          >
            <span>{a.emoji}</span>
            <span>{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LinkedIn Preview ──────────────────────────────────────────────────────────

function LinkedInPreview({ content, memberName, photoUrl }: PlatformPreviewProps) {
  return (
    <div
      style={{
        background: "#1b1f23",
        borderRadius: 8,
        border: "1px solid #2a3038",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px 10px" }}>
        <AvatarCircle name={memberName} size={48} />
        <div>
          <p style={{ color: "#e8e8e8", fontSize: 14, fontWeight: 600 }}>{memberName}</p>
          <p style={{ color: "#8b9197", fontSize: 12, marginTop: 1 }}>Monetura Member · 1st</p>
          <p style={{ color: "#8b9197", fontSize: 12 }}>Travel Creator | Lifestyle Entrepreneur</p>
        </div>
      </div>

      {/* Post text */}
      <p style={{ color: "#e8e8e8", fontSize: 13, lineHeight: 1.65, padding: "0 16px 12px" }}>
        {content.linkedinCaption.slice(0, 300)}
        {content.linkedinCaption.length > 300 ? "…" : ""}
      </p>

      {/* Photo */}
      <PhotoArea locationName="" photoUrl={photoUrl} aspectRatio="horizontal" />

      {/* Action bar */}
      <div style={{ display: "flex", padding: "6px 8px", borderTop: "1px solid #2a3038" }}>
        {(
          [
            { emoji: "👍", label: "Like" },
            { emoji: "💬", label: "Comment" },
            { emoji: "🔁", label: "Repost" },
            { emoji: "📤", label: "Send" },
          ] as const
        ).map((a) => (
          <div
            key={a.label}
            style={{
              flex: 1,
              color: "#8b9197",
              fontSize: 11,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "6px 0",
            }}
          >
            <span style={{ fontSize: 15 }}>{a.emoji}</span>
            <span>{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TikTok Preview ────────────────────────────────────────────────────────────

function TikTokPreview({ content, handle, photoUrl }: PlatformPreviewProps) {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: "min(200px, 100%)",
          border: "2px solid rgba(212,168,83,0.2)",
          borderRadius: 24,
          overflow: "hidden",
          background: "#000",
          aspectRatio: "9/16",
          position: "relative",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}
      >
        {/* Background */}
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="post preview"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, #2C2420 0%, #4A3728 100%)",
            }}
          />
        )}

        {/* Dark overlay for legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.82) 45%, transparent 75%)",
          }}
        />

        {/* Right side icons */}
        <div
          style={{
            position: "absolute",
            right: 8,
            bottom: 80,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            alignItems: "center",
          }}
        >
          {/* Heart */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="0.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span style={{ color: "#fff", fontSize: 9 }}>12.4K</span>
          </div>
          {/* Comment */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span style={{ color: "#fff", fontSize: 9 }}>284</span>
          </div>
          {/* Share */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span style={{ color: "#fff", fontSize: 9 }}>Share</span>
          </div>
          {/* Music disc */}
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#2C2420", fontSize: 11 }}>♪</span>
          </div>
        </div>

        {/* Bottom caption */}
        <div style={{ position: "absolute", bottom: 12, left: 10, right: 44 }}>
          <p style={{ color: "#fff", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>@{handle}</p>
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 10, lineHeight: 1.45 }}>
            {content.tiktokCaption.slice(0, 80)}
            {content.tiktokCaption.length > 80 ? "…" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Blog Preview ──────────────────────────────────────────────────────────────

function BlogPreview({ content }: { content: GeneratedContent }) {
  const wordCount = content.blogBody.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));
  return (
    <div
      style={{
        background: C.card,
        borderRadius: 12,
        padding: 22,
        border: `1px solid ${C.cardBorder}`,
      }}
    >
      <p
        style={{
          color: C.canyon,
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: 10,
          fontFamily: "var(--font-heading)",
        }}
      >
        {readTime} min read
      </p>
      <h2
        style={{
          color: C.cream,
          fontSize: 22,
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          lineHeight: 1.3,
          marginBottom: 12,
        }}
      >
        {content.blogTitle}
      </h2>
      <div style={{ width: 36, height: 2, background: C.gold, marginBottom: 14 }} />
      <p style={{ color: C.canyon, fontSize: 14, lineHeight: 1.75, marginBottom: 18 }}>
        {content.blogExcerpt.slice(0, 200)}
        {content.blogExcerpt.length > 200 ? "…" : ""}
      </p>
      <p style={{ color: C.gold, fontSize: 13, fontFamily: "var(--font-heading)" }}>Read more →</p>
    </div>
  );
}

// ── Magazine Preview ──────────────────────────────────────────────────────────

function MagazinePreview({ content }: { content: GeneratedContent }) {
  return (
    <div
      style={{
        background: C.card,
        borderRadius: 12,
        padding: 22,
        border: `1px solid ${C.cardBorder}`,
      }}
    >
      <p
        style={{
          color: C.gold,
          fontSize: 10,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          marginBottom: 14,
          fontFamily: "var(--font-heading)",
        }}
      >
        Published in Monetura Magazine
      </p>
      <h2
        style={{
          color: C.cream,
          fontSize: 26,
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 400,
          lineHeight: 1.2,
          marginBottom: 16,
        }}
      >
        {content.magazineTitle}
      </h2>
      <div style={{ width: 44, height: 1, background: C.gold, marginBottom: 16 }} />
      <p
        style={{
          color: C.canyon,
          fontSize: 14,
          lineHeight: 1.85,
          fontStyle: "italic",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        {content.magazineIntro.slice(0, 240)}
        {content.magazineIntro.length > 240 ? "…" : ""}
      </p>
    </div>
  );
}

// ── Platform preview dispatcher ───────────────────────────────────────────────

interface PlatformPreviewDispatchProps extends PlatformPreviewProps {
  platform: Platform;
}

function PlatformPreviewDispatch({ platform, ...props }: PlatformPreviewDispatchProps) {
  switch (platform) {
    case "instagram": return <InstagramPreview {...props} />;
    case "facebook":  return <FacebookPreview {...props} />;
    case "linkedin":  return <LinkedInPreview {...props} />;
    case "tiktok":    return <TikTokPreview {...props} />;
    case "blog":      return <BlogPreview content={props.content} />;
    case "magazine":  return <MagazinePreview content={props.content} />;
  }
}

// ── Step 1: Input ─────────────────────────────────────────────────────────────

interface Step1Props {
  experienceType: ExperienceType | null;
  setExperienceType: (t: ExperienceType) => void;
  locationName: string;
  setLocationName: (v: string) => void;
  memberNotes: string;
  setMemberNotes: (v: string) => void;
  creditsRemaining: number;
  onGenerate: () => void;
  onPhotosUploaded: (publicUrls: string[]) => void;
}

function Step1Input({
  experienceType,
  setExperienceType,
  locationName,
  setLocationName,
  memberNotes,
  setMemberNotes,
  creditsRemaining,
  onGenerate,
  onPhotosUploaded,
}: Step1Props) {
  const canGenerate = !!experienceType && memberNotes.trim().length >= 10 && creditsRemaining > 0;
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFilesSelected(files: FileList) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Show thumbnails immediately via object URLs
    const objectUrls = fileArray.map((f) => URL.createObjectURL(f));
    setThumbnails(objectUrls);
    setUploadStatus("uploading");
    setUploadError(null);

    try {
      const publicUrls: string[] = [];
      for (const file of fileArray) {
        const url = await uploadFile(file);
        publicUrls.push(url);
      }
      setUploadStatus("done");
      onPhotosUploaded(publicUrls);
    } catch (err) {
      setUploadStatus("error");
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* ── Photos upload ────────────────────────────────────────────── */}
      <div>
        <p
          className="text-xs tracking-[0.2em] uppercase mb-1"
          style={{ color: C.gold, fontFamily: "var(--font-heading)" }}
        >
          Your Photos
        </p>
        <p className="text-xs mb-3" style={{ color: C.mocha }}>
          Upload photos from your experience (optional)
        </p>

        {/* Dashed upload box */}
        <div
          onClick={() => uploadStatus !== "uploading" && photoInputRef.current?.click()}
          className="flex flex-col items-center gap-3 py-7 px-4 rounded-xl transition-all"
          style={{
            border: "2px dashed rgba(212,168,83,0.45)",
            background: "rgba(212,168,83,0.03)",
            cursor: uploadStatus === "uploading" ? "not-allowed" : "pointer",
          }}
        >
          {/* Camera icon */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D4A853"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>

          {thumbnails.length > 0 ? (
            <p className="text-sm" style={{ color: C.gold, fontFamily: "var(--font-heading)" }}>
              {thumbnails.length} photo{thumbnails.length !== 1 ? "s" : ""} selected
            </p>
          ) : (
            <p className="text-sm" style={{ color: C.canyon }}>
              Tap to add photos
            </p>
          )}

          <button
            type="button"
            disabled={uploadStatus === "uploading"}
            onClick={(e) => { e.stopPropagation(); photoInputRef.current?.click(); }}
            className="px-5 py-2 rounded-xl text-sm font-semibold tracking-[0.1em] uppercase transition-all active:scale-[0.97]"
            style={{
              background: uploadStatus === "uploading"
                ? C.card
                : `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`,
              color: uploadStatus === "uploading" ? C.mocha : "#2C2420",
              border: uploadStatus === "uploading" ? `1px solid ${C.cardBorder}` : "none",
              fontFamily: "var(--font-heading)",
              cursor: uploadStatus === "uploading" ? "not-allowed" : "pointer",
            }}
          >
            {thumbnails.length > 0 ? "Change Photos" : "Add Photos"}
          </button>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                void handleFilesSelected(e.target.files);
              }
            }}
            aria-label="Upload photos"
          />
        </div>

        {/* Upload status badge */}
        {uploadStatus === "uploading" && (
          <div
            className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-sm"
            style={{ background: "rgba(212,168,83,0.08)", border: `1px solid rgba(212,168,83,0.2)`, color: C.gold }}
          >
            <div
              className="w-3.5 h-3.5 rounded-full border border-current border-t-transparent animate-spin flex-shrink-0"
            />
            <span style={{ fontFamily: "var(--font-heading)" }}>Uploading...</span>
          </div>
        )}
        {uploadStatus === "done" && (
          <div
            className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-sm"
            style={{ background: "rgba(212,168,83,0.08)", border: `1px solid rgba(212,168,83,0.2)`, color: C.gold }}
          >
            <span>✓</span>
            <span style={{ fontFamily: "var(--font-heading)" }}>Upload complete</span>
          </div>
        )}
        {uploadStatus === "error" && (
          <div
            className="mt-3 px-3 py-2 rounded-lg text-sm"
            style={{ background: "rgba(193,122,74,0.1)", border: "1px solid rgba(193,122,74,0.3)", color: C.terracotta }}
          >
            {uploadError}
          </div>
        )}

        {/* Thumbnail row */}
        {thumbnails.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {thumbnails.map((src, i) => (
              <div
                key={i}
                className="flex-shrink-0 rounded-lg overflow-hidden"
                style={{
                  width: 72,
                  height: 72,
                  border: `1px solid ${C.cardBorder}`,
                  position: "relative",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Photo ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {uploadStatus === "done" && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 3,
                      right: 3,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: C.gold,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      color: "#2C2420",
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Experience type */}
      <div>
        <p
          className="text-sm tracking-[0.15em] uppercase mb-3"
          style={{ color: C.canyon }}
        >
          Experience Type
        </p>
        <div className="grid grid-cols-3 gap-2">
          {EXPERIENCE_TYPES.map((e) => {
            const active = experienceType === e.type;
            return (
              <button
                key={e.type}
                onClick={() => setExperienceType(e.type)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                style={{
                  background: active ? "rgba(212,168,83,0.12)" : C.card,
                  border: `1px solid ${active ? "rgba(212,168,83,0.4)" : C.cardBorder}`,
                  color: active ? C.gold : C.canyon,
                }}
              >
                <span className="text-xl">{e.icon}</span>
                <span className="text-sm" style={{ fontFamily: "var(--font-heading)" }}>
                  {e.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Location */}
      <div>
        <label
          className="text-sm tracking-[0.15em] uppercase block mb-2"
          style={{ color: C.canyon }}
        >
          Location <span style={{ color: C.mocha }}>(optional)</span>
        </label>
        <input
          type="text"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="e.g. Amalfi Coast, Italy"
          className="w-full px-4 py-3 rounded-xl text-base outline-none transition-all"
          style={{
            background: C.card,
            border: `1px solid ${C.cardBorder}`,
            color: C.cream,
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(212,168,83,0.4)")}
          onBlur={(e) => (e.target.style.borderColor = C.cardBorder)}
        />
      </div>

      {/* Notes */}
      <div>
        <label
          className="text-sm tracking-[0.15em] uppercase block mb-2"
          style={{ color: C.canyon }}
        >
          Your Notes
        </label>
        <textarea
          value={memberNotes}
          onChange={(e) => setMemberNotes(e.target.value)}
          rows={5}
          placeholder="Describe your experience — what you saw, felt, tasted, or learned. The more detail, the better the content."
          className="w-full px-4 py-3 rounded-xl text-base outline-none resize-none transition-all leading-relaxed"
          style={{
            background: C.card,
            border: `1px solid ${C.cardBorder}`,
            color: C.cream,
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(212,168,83,0.4)")}
          onBlur={(e) => (e.target.style.borderColor = C.cardBorder)}
        />
        <p className="text-right text-xs mt-1" style={{ color: C.mocha }}>
          {memberNotes.length}/2000
        </p>
      </div>

      {/* Credits + Generate */}
      <div className="flex items-center justify-between gap-3">
        <CreditsIndicator remaining={creditsRemaining} />
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold tracking-[0.1em] uppercase transition-all active:scale-[0.97]"
          style={{
            background: canGenerate
              ? `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`
              : C.card,
            color: canGenerate ? "#2C2420" : C.canyon,
            border: canGenerate ? "none" : `1px solid ${C.cardBorder}`,
            boxShadow: canGenerate ? "0 4px 16px rgba(212,168,83,0.25)" : "none",
            fontFamily: "var(--font-heading)",
            cursor: canGenerate ? "pointer" : "not-allowed",
          }}
        >
          <SparkleIcon />
          Generate
        </button>
      </div>

      {creditsRemaining === 0 && (
        <p className="text-sm text-center" style={{ color: C.terracotta }}>
          You have no AI credits remaining this month. Credits reset on the 1st.
        </p>
      )}
    </div>
  );
}

// ── Step 2: Loading ───────────────────────────────────────────────────────────

function Step2Loading({ messageIdx }: { messageIdx: number }) {
  const msg = LOADING_MESSAGES[messageIdx % LOADING_MESSAGES.length] ?? LOADING_MESSAGES[0]!;
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 gap-6">
      {/* Spinner */}
      <div
        className="w-16 h-16 rounded-full border-2 animate-spin"
        style={{
          borderColor: C.cardBorder,
          borderTopColor: C.gold,
        }}
      />
      <div className="text-center space-y-2">
        <p
          className="text-xl font-light"
          style={{ color: C.cream, fontFamily: "var(--font-heading)" }}
        >
          {msg}
        </p>
        <p className="text-sm tracking-widest uppercase" style={{ color: C.canyon }}>
          Claude is writing your content
        </p>
      </div>
    </div>
  );
}

// ── Step 3: Review ────────────────────────────────────────────────────────────

interface Step3Props {
  content: GeneratedContent;
  creditsRemaining: number;
  experienceType: ExperienceType;
  locationName: string;
  memberNotes: string;
  memberName: string;
  mediaUploadIds: string[];
  onRegenerate: () => void;
  onNext: () => void;
}

function Step3Review({
  content,
  creditsRemaining,
  locationName,
  memberName,
  mediaUploadIds,
  onNext,
}: Step3Props) {
  const [activeTab, setActiveTab] = useState<Platform>("instagram");
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");
  const [edited, setEdited] = useState<GeneratedContent>(content);

  const handle = deriveHandle(memberName);
  const photoUrl = mediaUploadIds[0] ?? null;

  function getPlatformContent(platform: Platform): string {
    switch (platform) {
      case "instagram": return edited.instagramCaption;
      case "facebook":  return edited.facebookCaption;
      case "linkedin":  return edited.linkedinCaption;
      case "tiktok":    return edited.tiktokCaption;
      case "blog":      return edited.blogBody;
      case "magazine":  return edited.magazineIntro;
    }
  }

  function setPlatformContent(platform: Platform, value: string) {
    setEdited((prev) => {
      const next = { ...prev };
      switch (platform) {
        case "instagram": next.instagramCaption = value; break;
        case "facebook":  next.facebookCaption = value;  break;
        case "linkedin":  next.linkedinCaption = value;  break;
        case "tiktok":    next.tiktokCaption = value;    break;
        case "blog":      next.blogBody = value;         break;
        case "magazine":  next.magazineIntro = value;    break;
      }
      return next;
    });
  }

  const p = PLATFORMS.find((pl) => pl.id === activeTab)!;
  const currentText = getPlatformContent(activeTab);

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
      {/* Platform tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {PLATFORMS.map((pl) => (
          <button
            key={pl.id}
            onClick={() => setActiveTab(pl.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === pl.id ? "rgba(212,168,83,0.12)" : C.card,
              border: `1px solid ${activeTab === pl.id ? "rgba(212,168,83,0.4)" : C.cardBorder}`,
              color: activeTab === pl.id ? C.gold : C.canyon,
              fontFamily: "var(--font-heading)",
            }}
          >
            {pl.label}
          </button>
        ))}
      </div>

      {/* Preview / Edit toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setViewMode("preview")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold tracking-[0.08em] uppercase transition-all"
          style={{
            background: viewMode === "preview" ? C.gold : C.card,
            color: viewMode === "preview" ? "#2C2420" : C.mocha,
            border: `1px solid ${viewMode === "preview" ? C.gold : C.cardBorder}`,
            fontFamily: "var(--font-heading)",
          }}
        >
          <span>👁</span>
          <span>Preview</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("edit")}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold tracking-[0.08em] uppercase transition-all"
          style={{
            background: viewMode === "edit" ? C.gold : C.card,
            color: viewMode === "edit" ? "#2C2420" : C.mocha,
            border: `1px solid ${viewMode === "edit" ? C.gold : C.cardBorder}`,
            fontFamily: "var(--font-heading)",
          }}
        >
          <span>✏️</span>
          <span>Edit</span>
        </button>
      </div>

      {/* ── Preview pane ─────────────────────────────────────────────── */}
      {viewMode === "preview" && (
        <div>
          <PlatformPreviewDispatch
            platform={activeTab}
            content={edited}
            memberName={memberName}
            handle={handle}
            locationName={locationName}
            photoUrl={photoUrl}
          />
        </div>
      )}

      {/* ── Edit pane ────────────────────────────────────────────────── */}
      {viewMode === "edit" && (
        <div className="space-y-4">
          {/* Blog title */}
          {activeTab === "blog" && (
            <div>
              <p className="text-sm tracking-widest uppercase mb-2" style={{ color: C.canyon }}>
                Title
              </p>
              <input
                value={edited.blogTitle}
                onChange={(e) => setEdited((prev) => ({ ...prev, blogTitle: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-base outline-none"
                style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.cream }}
              />
            </div>
          )}

          {/* Magazine title */}
          {activeTab === "magazine" && (
            <div>
              <p className="text-sm tracking-widest uppercase mb-2" style={{ color: C.canyon }}>
                Title
              </p>
              <input
                value={edited.magazineTitle}
                onChange={(e) => setEdited((prev) => ({ ...prev, magazineTitle: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-base outline-none"
                style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.cream }}
              />
            </div>
          )}

          {/* Caption / body textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs tracking-widest uppercase" style={{ color: C.canyon }}>
                {activeTab === "blog" ? "Article" : activeTab === "magazine" ? "Introduction" : "Caption"}
              </p>
              <p className="text-xs" style={{ color: C.mocha }}>
                {currentText.length}/{p.charLimit.toLocaleString()}
              </p>
            </div>
            <textarea
              value={currentText}
              onChange={(e) => setPlatformContent(activeTab, e.target.value)}
              rows={activeTab === "blog" ? 14 : 7}
              className="w-full px-4 py-3 rounded-xl text-base outline-none resize-none leading-relaxed"
              style={{ background: C.card, border: `1px solid ${C.cardBorder}`, color: C.cream }}
            />
          </div>

          {/* Instagram hashtag chips */}
          {activeTab === "instagram" && (
            <div>
              <p className="text-sm tracking-widest uppercase mb-2" style={{ color: C.canyon }}>
                Hashtags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {edited.instagramHashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full text-sm"
                    style={{
                      background: "rgba(212,168,83,0.08)",
                      border: "1px solid rgba(212,168,83,0.2)",
                      color: C.gold,
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    #{tag.replace(/^#/, "")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Credits + Continue */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <CreditsIndicator remaining={creditsRemaining} />
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold tracking-[0.1em] uppercase transition-all active:scale-[0.97]"
          style={{
            background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`,
            color: "#2C2420",
            boxShadow: "0 4px 16px rgba(212,168,83,0.25)",
            fontFamily: "var(--font-heading)",
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Publish ───────────────────────────────────────────────────────────

interface Step4Props {
  slug: string;
  onPublish: (platforms: Platform[], scheduleAt?: string) => void;
  publishing: boolean;
}

function Step4Publish({ slug, onPublish, publishing }: Step4Props) {
  const [selected, setSelected] = useState<Set<Platform>>(
    new Set(["instagram", "facebook"])
  );
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduleAt, setScheduleAt] = useState("");

  function toggle(pl: Platform) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pl)) next.delete(pl);
      else next.add(pl);
      return next;
    });
  }

  function handlePublish() {
    const platforms = Array.from(selected);
    onPublish(platforms, scheduleMode === "later" ? scheduleAt : undefined);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <div>
        <p
          className="text-sm tracking-[0.15em] uppercase mb-3"
          style={{ color: C.canyon }}
        >
          Select Platforms
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map((pl) => {
            const active = selected.has(pl.id);
            return (
              <button
                key={pl.id}
                onClick={() => toggle(pl.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  background: active ? "rgba(212,168,83,0.08)" : C.card,
                  border: `1px solid ${active ? "rgba(212,168,83,0.4)" : C.cardBorder}`,
                  color: active ? C.gold : C.canyon,
                }}
              >
                <span
                  className="w-5 h-5 rounded flex items-center justify-center text-[10px] flex-shrink-0"
                  style={{
                    background: active ? C.gold : C.mocha,
                    color: active ? "#2C2420" : C.canyon,
                  }}
                >
                  {active ? "✓" : ""}
                </span>
                <span className="text-base" style={{ fontFamily: "var(--font-heading)" }}>
                  {pl.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule toggle */}
      <div>
        <p className="text-sm tracking-[0.15em] uppercase mb-3" style={{ color: C.canyon }}>
          Timing
        </p>
        <div className="flex gap-2">
          {(["now", "later"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setScheduleMode(mode)}
              className="flex-1 py-2.5 rounded-xl text-base transition-all"
              style={{
                background: scheduleMode === mode ? "rgba(212,168,83,0.08)" : C.card,
                border: `1px solid ${scheduleMode === mode ? "rgba(212,168,83,0.4)" : C.cardBorder}`,
                color: scheduleMode === mode ? C.gold : C.canyon,
                fontFamily: "var(--font-heading)",
              }}
            >
              {mode === "now" ? "Post Now" : "Schedule"}
            </button>
          ))}
        </div>
        {scheduleMode === "later" && (
          <input
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            className="mt-3 w-full px-4 py-3 rounded-xl text-base outline-none"
            style={{
              background: C.card,
              border: `1px solid ${C.cardBorder}`,
              color: C.cream,
              colorScheme: "dark",
            }}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          className="flex-1 py-3 rounded-xl text-base transition-all"
          style={{
            background: C.card,
            border: `1px solid ${C.cardBorder}`,
            color: C.canyon,
            fontFamily: "var(--font-heading)",
          }}
        >
          Save Draft
        </button>
        <button
          onClick={handlePublish}
          disabled={selected.size === 0 || publishing}
          className="flex-1 py-3 rounded-xl text-base font-semibold tracking-[0.1em] uppercase transition-all active:scale-[0.97]"
          style={{
            background:
              selected.size > 0 && !publishing
                ? `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`
                : C.card,
            color: selected.size > 0 && !publishing ? "#2C2420" : C.canyon,
            boxShadow:
              selected.size > 0 && !publishing
                ? "0 4px 16px rgba(212,168,83,0.25)"
                : "none",
            fontFamily: "var(--font-heading)",
            cursor: selected.size > 0 && !publishing ? "pointer" : "not-allowed",
          }}
        >
          {publishing ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  );
}

// ── Success banner ────────────────────────────────────────────────────────────

function SuccessBanner() {
  return (
    <div className="max-w-xl mx-auto px-4 py-12 flex flex-col items-center gap-6 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: "rgba(212,168,83,0.12)", border: "1px solid rgba(212,168,83,0.3)" }}
      >
        <span className="text-2xl">✓</span>
      </div>
      <div>
        <h2
          className="text-3xl font-light mb-2"
          style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
        >
          Content Published
        </h2>
        <p className="text-sm" style={{ color: "#8B6E52" }}>
          Your content is being sent to your connected platforms.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="px-8 py-3 rounded-xl text-sm font-semibold tracking-[0.1em] uppercase"
        style={{
          background: "linear-gradient(135deg, #D4A853 0%, #C4973D 100%)",
          color: "#2C2420",
          fontFamily: "var(--font-heading)",
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

interface CreateWizardProps {
  memberId: number;
  memberTier: MemberTier;
  initialCredits: number;
  memberName: string;
}

export function CreateWizard({ initialCredits, memberName }: CreateWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | "done">(1);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Step 1 state
  const [experienceType, setExperienceType] = useState<ExperienceType | null>(null);
  const [locationName, setLocationName] = useState("");
  const [memberNotes, setMemberNotes] = useState("");

  // Step 3 state
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [slug, setSlug] = useState("");
  const [creditsRemaining, setCreditsRemaining] = useState(initialCredits);
  const [mediaUploadIds, setMediaUploadIds] = useState<string[]>([]);

  // Step 4 state
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!experienceType) return;
    setError(null);
    setStep(2);

    // Rotate loading messages
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setLoadingMsgIdx(idx);
    }, 1800);

    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberNotes,
          experienceType,
          locationName,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        content?: GeneratedContent;
        slug?: string;
        creditsRemaining?: number;
        error?: string;
      };
      clearInterval(interval);
      if (!res.ok || !data.success) {
        setError(data.error ?? "Generation failed.");
        setStep(1);
        return;
      }
      setContent(data.content!);
      setSlug(data.slug!);
      setCreditsRemaining(data.creditsRemaining!);
      // mediaUploadIds is set by onPhotosUploaded — do not overwrite here
      setStep(3);
    } catch {
      clearInterval(interval);
      setError("Network error. Please try again.");
      setStep(1);
    }
  }

  async function handlePublish(platforms: Platform[], scheduleAt?: string) {
    setPublishing(true);
    try {
      await fetch("/api/content/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, platforms, scheduleAt }),
      });
      setStep("done");
    } catch {
      // non-blocking — optimistic
      setStep("done");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-4 flex items-center gap-4"
        style={{
          background: C.sidebar,
          borderBottom: `1px solid ${C.cardBorder}`,
        }}
      >
        <Link href="/dashboard" style={{ color: C.canyon }}>
          <BackArrow />
        </Link>
        <div className="flex-1">
          <h1
            className="text-lg font-light tracking-[0.15em]"
            style={{ color: C.cream, fontFamily: "var(--font-heading)" }}
          >
            Content Studio
          </h1>
        </div>
        {/* Step indicator */}
        {step !== "done" && (
          <div className="flex items-center gap-1.5">
            {([1, 2, 3, 4] as const).map((s) => (
              <div
                key={s}
                className="rounded-full transition-all"
                style={{
                  width: s === (step === 2 ? 2 : step) ? "20px" : "6px",
                  height: "6px",
                  background:
                    s <= (step === 2 ? 2 : step as number) ? C.gold : C.mocha,
                }}
              />
            ))}
          </div>
        )}
      </header>

      {/* Step labels */}
      {step !== "done" && (
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ borderBottom: `1px solid ${C.cardBorder}` }}
        >
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: C.canyon }}>
            {step === 1 && "Step 1 — Your Experience"}
            {step === 2 && "Step 2 — Generating"}
            {step === 3 && "Step 3 — Review & Edit"}
            {step === 4 && "Step 4 — Publish"}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="mx-4 mt-4 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "rgba(193,122,74,0.1)",
            border: "1px solid rgba(193,122,74,0.3)",
            color: C.terracotta,
          }}
        >
          {error}
        </div>
      )}

      {/* Steps */}
      {step === 1 && (
        <Step1Input
          experienceType={experienceType}
          setExperienceType={setExperienceType}
          locationName={locationName}
          setLocationName={setLocationName}
          memberNotes={memberNotes}
          setMemberNotes={setMemberNotes}
          creditsRemaining={creditsRemaining}
          onGenerate={handleGenerate}
          onPhotosUploaded={(urls) => setMediaUploadIds(urls)}
        />
      )}

      {step === 2 && <Step2Loading messageIdx={loadingMsgIdx} />}

      {step === 3 && content && (
        <Step3Review
          content={content}
          creditsRemaining={creditsRemaining}
          experienceType={experienceType!}
          locationName={locationName}
          memberNotes={memberNotes}
          memberName={memberName}
          mediaUploadIds={mediaUploadIds}
          onRegenerate={handleGenerate}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <Step4Publish
          slug={slug}
          onPublish={handlePublish}
          publishing={publishing}
        />
      )}

      {step === "done" && <SuccessBanner />}
    </div>
  );
}
