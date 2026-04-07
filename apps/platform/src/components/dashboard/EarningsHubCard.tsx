"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon, ArrowRightIcon } from "./icons";

export function EarningsHubCard() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText("MTR-00247");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const referralProgress = (2 / 3) * 100;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#2C2420",
        border: "1px solid #4A3728",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(90deg, #C17A4A 0%, #D4A853 60%, transparent 100%)" }}
      />

      <div className="p-5">
        <p className="text-xs tracking-[0.15em] uppercase mb-1.5" style={{ color: "#C4A882" }}>
          Earnings Hub
        </p>

        {/* Balance */}
        <div className="flex items-end gap-2 mb-5">
          <span
            className="text-4xl font-light leading-none"
            style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
          >
            $1,240
          </span>
          <span className="text-sm mb-1" style={{ color: "#C4A882" }}>
            CAD this month
          </span>
        </div>

        {/* Referral progress */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{ background: "#1A0F0A", border: "1px solid #4A3728" }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs" style={{ color: "#E8DCCB" }}>
              Referral to free membership
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
            >
              2 of 3
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "#3D2E26" }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${referralProgress}%`,
                background: "linear-gradient(90deg, #C17A4A 0%, #D4A853 100%)",
              }}
            />
          </div>
          <p className="text-[11px] mt-2" style={{ color: "#C4A882" }}>
            1 more referral unlocks free membership
          </p>
        </div>

        {/* Affiliate link */}
        <div
          className="rounded-xl p-3.5 flex items-center justify-between mb-4"
          style={{ background: "#1A0F0A", border: "1px solid #4A3728" }}
        >
          <div>
            <p className="text-[10px] tracking-[0.12em] uppercase mb-0.5" style={{ color: "#C4A882" }}>
              Affiliate Link
            </p>
            <p
              className="text-sm font-semibold tracking-widest"
              style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
            >
              MTR-00247
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-95"
            style={{
              background: copied ? "#1F3A1F" : "#2C2420",
              border: `1px solid ${copied ? "#4A7A4A" : "#4A3728"}`,
              color: copied ? "#7DAF7D" : "#C4A882",
            }}
          >
            {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* View full earnings link */}
        <button
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
        >
          View Full Earnings
          <ArrowRightIcon size={14} />
        </button>
      </div>
    </div>
  );
}
