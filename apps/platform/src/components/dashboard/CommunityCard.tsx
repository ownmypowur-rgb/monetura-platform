"use client";

import Link from "next/link";
import { TrophyIcon, ArrowRightIcon } from "./icons";

export interface ChallengeSummary {
  title: string;
  creditReward: number;
  /** Days until the challenge ends, or null when no end date is set. */
  daysLeft: number | null;
  entriesCount: number;
}

interface CommunityCardProps {
  challenge: ChallengeSummary | null;
}

export function CommunityCard({ challenge }: CommunityCardProps) {
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
              {challenge ? "Active Challenge" : "Community"}
            </p>
            <h2
              className="text-2xl font-light leading-snug"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              {challenge ? challenge.title : "No active challenge"}
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

        {challenge ? (
          <>
            {/* Reward + days */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div
                className="rounded-xl p-3"
                style={{ background: "#1A0F0A", border: "1px solid #4A3728" }}
              >
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#C4A882" }}>
                  Reward
                </p>
                <p
                  className="text-2xl font-light"
                  style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
                >
                  {challenge.creditReward}
                </p>
                <p className="text-xs" style={{ color: "#C4A882" }}>
                  AI credits + Featured
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
                  {challenge.daysLeft ?? "—"}
                </p>
                <p className="text-xs" style={{ color: "#C4A882" }}>
                  days left
                </p>
              </div>
            </div>

            {/* Entries */}
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm" style={{ color: "#E8DCCB" }}>
                Community entries
              </span>
              <span
                className="text-xs font-semibold"
                style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
              >
                {challenge.entriesCount} so far
              </span>
            </div>

            {/* CTA — entries are content posts until /community ships */}
            <Link
              href="/create"
              className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-base font-semibold tracking-[0.1em] uppercase transition-all active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #C17A4A 0%, #D4A853 100%)",
                color: "#2C2420",
                boxShadow: "0 4px 16px rgba(193,122,74,0.25)",
                fontFamily: "var(--font-heading)",
                textDecoration: "none",
              }}
            >
              Create Your Entry
              <ArrowRightIcon size={14} />
            </Link>
          </>
        ) : (
          <p className="text-sm leading-relaxed" style={{ color: "#C4A882" }}>
            A new community challenge is being prepared. Check back soon — in
            the meantime, keep creating.
          </p>
        )}
      </div>
    </div>
  );
}
