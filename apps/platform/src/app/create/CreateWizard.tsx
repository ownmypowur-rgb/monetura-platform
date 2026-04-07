"use client";

import { useState } from "react";
import Link from "next/link";
import type { MemberTier } from "@/types/next-auth";
import { UploadZone } from "@/components/create/UploadZone";

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
  cardBorder: "#4A3728",   // brighter borders for readability
  gold: "#D4A853",
  goldDark: "#C4973D",
  mocha: "#C4A882",        // muted text — was #4A3728 (too dark)
  canyon: "#E8DCCB",       // secondary text — was #8B6E52 (too dark)
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

// ── Step 1: Input ─────────────────────────────────────────────────────────────

interface Step1Props {
  experienceType: ExperienceType | null;
  setExperienceType: (t: ExperienceType) => void;
  locationName: string;
  setLocationName: (v: string) => void;
  memberNotes: string;
  setMemberNotes: (v: string) => void;
  creditsRemaining: number;
  mediaUploadIds: number[];
  setMediaUploadIds: (ids: number[]) => void;
  onGenerate: () => void;
}

function Step1Input({
  experienceType,
  setExperienceType,
  locationName,
  setLocationName,
  memberNotes,
  setMemberNotes,
  creditsRemaining,
  mediaUploadIds,
  setMediaUploadIds,
  onGenerate,
}: Step1Props) {
  const canGenerate = !!experienceType && memberNotes.trim().length >= 10 && creditsRemaining > 0;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Photos upload */}
      <div>
        <p
          className="text-sm tracking-[0.15em] uppercase mb-1"
          style={{ color: "#E8DCCB" }}
        >
          Your Photos
        </p>
        <p className="text-xs mb-3" style={{ color: "#C4A882" }}>
          Upload photos from your experience{" "}
          <span style={{ color: "#C4A882" }}>(optional but recommended)</span>
        </p>
        <UploadZone onMediaUploadIds={setMediaUploadIds} />
        {mediaUploadIds.length > 0 && (
          <p className="text-xs mt-1" style={{ color: "#D4A853" }}>
            {mediaUploadIds.length} photo{mediaUploadIds.length !== 1 ? "s" : ""} ready
          </p>
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
  onRegenerate: () => void;
  onNext: () => void;
}

function Step3Review({
  content,
  creditsRemaining,
  onNext,
}: Step3Props) {
  const [activeTab, setActiveTab] = useState<Platform>("instagram");
  const [edited, setEdited] = useState<GeneratedContent>(content);

  function getPlatformContent(platform: Platform): string {
    switch (platform) {
      case "instagram": return edited.instagramCaption;
      case "facebook": return edited.facebookCaption;
      case "linkedin": return edited.linkedinCaption;
      case "tiktok": return edited.tiktokCaption;
      case "blog": return edited.blogBody;
      case "magazine": return edited.magazineIntro;
    }
  }

  function setPlatformContent(platform: Platform, value: string) {
    setEdited((prev) => {
      const next = { ...prev };
      switch (platform) {
        case "instagram": next.instagramCaption = value; break;
        case "facebook": next.facebookCaption = value; break;
        case "linkedin": next.linkedinCaption = value; break;
        case "tiktok": next.tiktokCaption = value; break;
        case "blog": next.blogBody = value; break;
        case "magazine": next.magazineIntro = value; break;
      }
      return next;
    });
  }

  const p = PLATFORMS.find((p) => p.id === activeTab)!;
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

      {/* Blog title when on blog */}
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

      {/* Magazine title when on magazine */}
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

  function toggle(p: Platform) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
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
}

export function CreateWizard({ initialCredits }: CreateWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | "done">(1);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Step 1 state
  const [experienceType, setExperienceType] = useState<ExperienceType | null>(null);
  const [locationName, setLocationName] = useState("");
  const [memberNotes, setMemberNotes] = useState("");
  const [mediaUploadIds, setMediaUploadIds] = useState<number[]>([]);

  // Step 3 state
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [slug, setSlug] = useState("");
  const [creditsRemaining, setCreditsRemaining] = useState(initialCredits);

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
          mediaUploadIds: mediaUploadIds.length > 0 ? mediaUploadIds : undefined,
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
      setStep(3);
    } catch (err) {
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

  const stepNumber = step === "done" ? 4 : step === 2 ? 2 : step;

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
          mediaUploadIds={mediaUploadIds}
          setMediaUploadIds={setMediaUploadIds}
          onGenerate={handleGenerate}
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
