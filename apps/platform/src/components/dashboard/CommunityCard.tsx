"use client";

import { TrophyIcon, ArrowRightIcon } from "./icons";

export function CommunityCard() {
  const entriesProgress = (47 / 100) * 100; // 47 entries toward 100 goal

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#2C2420",
        border: "1px solid #4A3728",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* Terracotta accent */}
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(90deg, #C17A4A 0%, #D4A853 40%, transparent 100%)" }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm tracking-[0.15em] uppercase mb-1.5" style={{ color: "#C4A882" }}>
              Active Challenge
            </p>
            <h2
              className="text-2xl font-light leading-snug"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              Kill Them With Kindness
              <br />Challenge
            </h2>
          </div>
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
            style={{
              background: "rgba(212,168,83,0.08)",
              border: "1px solid rgba(212,168,83,0.2)",
            }}
          >
            <TrophyIcon size={20} style={{ color: "#D4A853" }} />
          </div>
        </div>

        {/* Prize + days */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div
            className="rounded-xl p-3"
            style={{ background: "#1A0F0A", border: "1px solid #4A3728" }}
          >
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#C4A882" }}>
              Prize
            </p>
            <p
              className="text-2xl font-light"
              style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
            >
              $500
            </p>
            <p className="text-xs" style={{ color: "#C4A882" }}>
              CAD + Featured
            </p>
          </div>
          <div
            className="rounded-xl p-3"
            style={{ background: "#1A0F0A", border: "1px solid #4A3728" }}
          >
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#C4A882" }}>
              Remaining
            </p>
            <p
              className="text-2xl font-light"
              style={{ color: "#C17A4A", fontFamily: "var(--font-heading)" }}
            >
              24
            </p>
            <p className="text-xs" style={{ color: "#C4A882" }}>
              days left
            </p>
          </div>
        </div>

        {/* Entry progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: "#E8DCCB" }}>
              Community entries
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
            >
              47 so far
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "#3D2E26" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${entriesProgress}%`,
                background: "linear-gradient(90deg, #C17A4A 0%, #D4A853 100%)",
              }}
            />
          </div>
        </div>

        {/* CTA */}
        <button
          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-base font-semibold tracking-[0.1em] uppercase transition-all active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #C17A4A 0%, #D4A853 100%)",
            color: "#2C2420",
            boxShadow: "0 4px 16px rgba(193,122,74,0.25)",
            fontFamily: "var(--font-heading)",
          }}
        >
          Submit Your Entry
          <ArrowRightIcon size={14} />
        </button>
      </div>
    </div>
  );
}
