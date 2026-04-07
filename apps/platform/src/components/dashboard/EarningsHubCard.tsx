"use client";

import { useState, useEffect } from "react";
import { CopyIcon, CheckIcon, ArrowRightIcon } from "./icons";

interface AffiliateData {
  code: string;
  trackingUrl: string;
  clicksThisMonth: number;
  referralCount: number;
}

const REFERRALS_FOR_FREE = 3;

export function EarningsHubCard() {
  const [copied, setCopied] = useState(false);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);

  useEffect(() => {
    void fetch("/api/member/affiliate")
      .then((r) => r.ok ? r.json() as Promise<AffiliateData> : null)
      .then((data) => { if (data) setAffiliate(data); })
      .catch(() => { /* non-blocking */ });
  }, []);

  const code = affiliate?.code ?? "MTR-—";
  const trackingUrl = affiliate?.trackingUrl ?? "";
  const clicksThisMonth = affiliate?.clicksThisMonth ?? 0;
  const referralCount = affiliate?.referralCount ?? 0;
  const referralProgress = Math.min((referralCount / REFERRALS_FOR_FREE) * 100, 100);
  const referralsLeft = Math.max(REFERRALS_FOR_FREE - referralCount, 0);

  function handleCopy() {
    if (!trackingUrl) return;
    void navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
        <p className="text-sm tracking-[0.15em] uppercase mb-1.5" style={{ color: "#C4A882" }}>
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
          <span className="text-base mb-1" style={{ color: "#C4A882" }}>
            CAD this month
          </span>
        </div>

        {/* Referral progress */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{ background: "#1A0F0A", border: "1px solid #4A3728" }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm" style={{ color: "#E8DCCB" }}>
              Referral to free membership
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
            >
              {referralCount} of {REFERRALS_FOR_FREE}
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
          <p className="text-xs mt-2" style={{ color: "#C4A882" }}>
            {referralsLeft > 0
              ? `${referralsLeft} more referral${referralsLeft === 1 ? "" : "s"} unlock${referralsLeft === 1 ? "s" : ""} free membership`
              : "Free membership unlocked!"}
          </p>
        </div>

        {/* Affiliate link */}
        <div
          className="rounded-xl p-3.5 mb-4"
          style={{ background: "#1A0F0A", border: "1px solid #4A3728" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs tracking-[0.12em] uppercase mb-0.5" style={{ color: "#C4A882" }}>
                Affiliate Link
              </p>
              <p
                className="text-sm font-semibold tracking-widest"
                style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
              >
                {code}
              </p>
            </div>
            <button
              onClick={handleCopy}
              disabled={!trackingUrl}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-40"
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
          <p className="text-xs" style={{ color: "#8B6E52" }}>
            {clicksThisMonth} click{clicksThisMonth === 1 ? "" : "s"} this month
          </p>
        </div>

        {/* View full earnings link */}
        <button
          className="flex items-center gap-2 text-base font-medium transition-colors"
          style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
        >
          View Full Earnings
          <ArrowRightIcon size={14} />
        </button>
      </div>
    </div>
  );
}
