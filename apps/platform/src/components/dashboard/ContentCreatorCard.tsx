"use client";

import Link from "next/link";
import { CameraIcon, SparkleIcon } from "./icons";

export function ContentCreatorCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#2C2420",
        border: "1px solid #4A3728",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* Gold accent bar */}
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(90deg, #D4A853 0%, #C17A4A 50%, transparent 100%)" }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm tracking-[0.15em] uppercase mb-1.5" style={{ color: "#C4A882" }}>
              Content Studio
            </p>
            <h2
              className="text-2xl font-light"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              Create Your Next Post
            </h2>
          </div>
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
            style={{ background: "#1A0F0A", border: "1px solid #4A3728" }}
          >
            <CameraIcon size={20} style={{ color: "#D4A853" }} />
          </div>
        </div>

        {/* Subtext */}
        <p className="text-base leading-relaxed mb-5" style={{ color: "#E8DCCB" }}>
          Upload photos from your latest experience and let AI do the rest — captions, hashtags, and multi-platform scheduling.
        </p>

        {/* Aspirational line — real per-post analytics land once tracking exists */}
        <div
          className="rounded-xl p-3.5 mb-5"
          style={{ background: "#1A0F0A", border: "1px solid #4A3728" }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "#C4A882" }}>
            One photo. One note. Captions for every platform — written in your
            voice, ready in seconds.
          </p>
        </div>

        {/* CTA button */}
        <Link
          href="/create"
          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold tracking-[0.1em] uppercase transition-all active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #D4A853 0%, #C4973D 100%)",
            color: "#2C2420",
            boxShadow: "0 4px 16px rgba(212,168,83,0.25)",
            fontFamily: "var(--font-heading)",
            textDecoration: "none",
            display: "flex",
          }}
        >
          <SparkleIcon size={16} />
          Start Creating
        </Link>
      </div>
    </div>
  );
}
