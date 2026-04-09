"use client";

import { useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommissionRow {
  id: number;
  amountCents: number;
  status: "pending" | "approved" | "paid" | "cancelled";
  createdAt: string;
  referredMemberId: number | null;
}

export interface ReferredMember {
  id: number;
  name: string;
  status: string;
  createdAt: string;
}

export interface EarningsClientProps {
  commissionsThisMonth: number;
  commissionsAllTime: number;
  pendingAmount: number;
  referralCount: number;
  milestoneReached: boolean;
  affiliateCode: string;
  trackingUrl: string;
  clicksThisMonth: number;
  clicksAllTime: number;
  commissions: CommissionRow[];
  referredMembers: ReferredMember[];
  memberTier: string;
}

const PAGE_SIZE = 20;
const REFERRALS_FOR_FREE = 3;

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function fmtCad(dollars: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(dollars);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function currentMonthEnd(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: "rgba(212,168,83,0.12)", color: "#D4A853", label: "Pending" },
    approved: { bg: "rgba(74,186,124,0.12)", color: "#4ABA7C", label: "Confirmed" },
    paid: { bg: "rgba(139,110,82,0.18)", color: "#C4A882", label: "Paid" },
    cancelled: { bg: "rgba(220,38,38,0.08)", color: "#FCA5A5", label: "Cancelled" },
  };
  const s = styles[status] ?? styles["pending"]!;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function TypeBadge() {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: "rgba(59,130,246,0.12)", color: "#60A5FA" }}
    >
      Referral Signup
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export function EarningsClient({
  commissionsThisMonth,
  commissionsAllTime,
  pendingAmount,
  referralCount,
  milestoneReached,
  affiliateCode,
  trackingUrl,
  clicksThisMonth,
  clicksAllTime,
  commissions,
  referredMembers,
  memberTier,
}: EarningsClientProps) {
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(0);

  const referralProgress = Math.min((referralCount / REFERRALS_FOR_FREE) * 100, 100);
  const referralsLeft = Math.max(REFERRALS_FOR_FREE - referralCount, 0);
  const totalPages = Math.ceil(commissions.length / PAGE_SIZE);
  const pageCommissions = commissions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const conversionRate =
    clicksAllTime > 0 ? ((referredMembers.length / clicksAllTime) * 100).toFixed(1) : "0.0";
  const isFounder = memberTier === "founder";

  function handleCopy() {
    if (!trackingUrl) return;
    void navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ background: "#1A0F0A" }}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Back link ─────────────────────────────────────────── */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm transition-colors"
          style={{ color: "#8B6E52" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Dashboard
        </Link>

        {/* ── Header + stat cards ───────────────────────────────── */}
        <div>
          <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: "#8B6E52" }}>
            Member Earnings
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light mb-6"
            style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
          >
            Your Earnings
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* This month */}
            <div
              className="rounded-2xl p-6"
              style={{ background: "#2C2420", border: "1px solid #4A3728" }}
            >
              <div
                className="h-px w-full mb-4"
                style={{ background: "linear-gradient(90deg, #C17A4A 0%, #D4A853 60%, transparent 100%)" }}
              />
              <p className="text-xs tracking-[0.15em] uppercase mb-3" style={{ color: "#8B6E52" }}>
                Earned this month
              </p>
              <p
                className="text-4xl font-light"
                style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
              >
                {fmtCad(commissionsThisMonth)}
              </p>
              <p className="text-sm mt-2" style={{ color: "#8B6E52" }}>
                confirmed + pending
              </p>
            </div>

            {/* All time */}
            <div
              className="rounded-2xl p-6"
              style={{ background: "#2C2420", border: "1px solid #4A3728" }}
            >
              <div
                className="h-px w-full mb-4"
                style={{ background: "linear-gradient(90deg, transparent 0%, #4A3728 100%)" }}
              />
              <p className="text-xs tracking-[0.15em] uppercase mb-3" style={{ color: "#8B6E52" }}>
                All-time confirmed
              </p>
              <p
                className="text-3xl font-light"
                style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
              >
                {fmtCad(commissionsAllTime)}
              </p>
              <p className="text-sm mt-2" style={{ color: "#8B6E52" }}>
                total paid out
              </p>
            </div>
          </div>
        </div>

        {/* ── Referral progress card ────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#2C2420", border: "1px solid #4A3728" }}
        >
          <div
            className="h-px w-full"
            style={{ background: "linear-gradient(90deg, #C17A4A 0%, #D4A853 60%, transparent 100%)" }}
          />
          <div className="p-6">
            <h2
              className="text-lg font-light mb-1"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              Referral Progress
            </h2>

            {isFounder && (
              <p className="text-sm mb-4" style={{ color: "#D4A853" }}>
                As a founder you earn cash commissions directly on every referral.
              </p>
            )}

            {/* Progress bar */}
            <div
              className="rounded-xl p-5 mb-6"
              style={{ background: "#1A0F0A", border: "1px solid #3D2E26" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-base" style={{ color: "#E8DCCB" }}>
                  {milestoneReached
                    ? "Free membership milestone reached!"
                    : `${referralsLeft} referral${referralsLeft === 1 ? "" : "s"} to free membership`}
                </span>
                <span
                  className="text-xl font-semibold"
                  style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
                >
                  {referralCount} <span className="text-base font-light" style={{ color: "#8B6E52" }}>of {REFERRALS_FOR_FREE}</span>
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: "#3D2E26" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${referralProgress}%`,
                    background: milestoneReached
                      ? "#D4A853"
                      : "linear-gradient(90deg, #C17A4A 0%, #D4A853 100%)",
                  }}
                />
              </div>
              {milestoneReached && (
                <p className="text-xs mt-3" style={{ color: "#4ABA7C" }}>
                  Your free membership benefit has been applied.
                </p>
              )}
            </div>

            {/* Share your link */}
            <div>
              <p className="text-xs tracking-[0.15em] uppercase mb-3" style={{ color: "#8B6E52" }}>
                Share your link
              </p>
              <div
                className="rounded-xl p-4 space-y-3"
                style={{ background: "#1A0F0A", border: "1px solid #3D2E26" }}
              >
                {/* Code display */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] mb-1" style={{ color: "#8B6E52" }}>
                      Your code
                    </p>
                    <p
                      className="text-2xl font-semibold tracking-widest"
                      style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
                    >
                      {affiliateCode}
                    </p>
                  </div>
                  <button
                    onClick={handleCopy}
                    disabled={!trackingUrl}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-40"
                    style={{
                      background: copied ? "rgba(74,186,124,0.1)" : "#2C2420",
                      border: `1px solid ${copied ? "#4ABA7C" : "#4A3728"}`,
                      color: copied ? "#4ABA7C" : "#C4A882",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      {copied ? (
                        <polyline points="20,6 9,17 4,12" />
                      ) : (
                        <>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </>
                      )}
                    </svg>
                    {copied ? "Copied!" : "Copy link"}
                  </button>
                </div>
                {/* Full URL */}
                {trackingUrl && (
                  <p
                    className="text-sm break-all"
                    style={{ color: "#8B6E52", fontFamily: "var(--font-heading)" }}
                  >
                    {trackingUrl}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Commission history ─────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#2C2420", border: "1px solid #4A3728" }}
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: "#4A3728" }}>
            <h2
              className="text-lg font-light"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              Commission History
            </h2>
          </div>

          {commissions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-base mb-2" style={{ color: "#8B6E52" }}>
                No commissions yet.
              </p>
              <p className="text-sm" style={{ color: "#4A3728" }}>
                Share your affiliate link to start earning.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #4A3728" }}>
                      {["Date", "Type", "Description", "Amount (CAD)", "Status"].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs tracking-[0.12em] uppercase"
                          style={{ color: "#8B6E52" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageCommissions.map((c, i) => (
                      <tr
                        key={c.id}
                        style={{
                          borderBottom:
                            i < pageCommissions.length - 1 ? "1px solid #3D2E26" : undefined,
                        }}
                      >
                        <td className="px-6 py-4 text-sm whitespace-nowrap" style={{ color: "#C4A882" }}>
                          {fmtDate(c.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <TypeBadge />
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: "#E8DCCB" }}>
                          {c.referredMemberId
                            ? `Referral — member #${c.referredMemberId}`
                            : "Commission"}
                        </td>
                        <td
                          className="px-6 py-4 text-sm font-semibold whitespace-nowrap"
                          style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
                        >
                          {fmtCad(c.amountCents / 100)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={c.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden">
                {pageCommissions.map((c, i) => (
                  <div
                    key={c.id}
                    className="px-4 py-4 space-y-2"
                    style={{
                      borderBottom:
                        i < pageCommissions.length - 1 ? "1px solid #3D2E26" : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <TypeBadge />
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-sm" style={{ color: "#E8DCCB" }}>
                      {c.referredMemberId
                        ? `Referral — member #${c.referredMemberId}`
                        : "Commission"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#8B6E52" }}>
                        {fmtDate(c.createdAt)}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
                      >
                        {fmtCad(c.amountCents / 100)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="flex items-center justify-between px-6 py-4 border-t"
                  style={{ borderColor: "#4A3728" }}
                >
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-40"
                    style={{ background: "#1A0F0A", border: "1px solid #4A3728", color: "#C4A882" }}
                  >
                    Previous
                  </button>
                  <span className="text-sm" style={{ color: "#8B6E52" }}>
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    className="px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-40"
                    style={{ background: "#1A0F0A", border: "1px solid #4A3728", color: "#C4A882" }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Payout info card ──────────────────────────────────── */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "#2C2420", border: "1px solid #4A3728" }}
        >
          <h2
            className="text-lg font-light mb-4"
            style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
          >
            How payouts work
          </h2>
          <div className="space-y-0">
            {[
              {
                label: "Confirmation window",
                value: "Commissions are confirmed after a 30-day window",
              },
              {
                label: "Payout schedule",
                value: "Processed on the 1st of each month via e-transfer",
              },
              {
                label: "Minimum threshold",
                value: "$50 CAD",
              },
              {
                label: "Current pending balance",
                value: fmtCad(pendingAmount),
              },
              {
                label: "Next payout date",
                value: currentMonthEnd(),
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 border-b last:border-0"
                style={{ borderColor: "#3D2E26" }}
              >
                <span className="text-sm mb-0.5 sm:mb-0" style={{ color: "#8B6E52" }}>
                  {label}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: "#E8DCCB", fontFamily: "var(--font-heading)" }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Affiliate stats ───────────────────────────────────── */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "#2C2420", border: "1px solid #4A3728" }}
        >
          <h2
            className="text-lg font-light mb-5"
            style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
          >
            Affiliate Stats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Clicks this month", value: String(clicksThisMonth) },
              { label: "Total conversions", value: String(referredMembers.length) },
              {
                label: "Conversion rate",
                value: `${conversionRate}%`,
                sub: "clicks → signups",
              },
            ].map(({ label, value, sub }) => (
              <div
                key={label}
                className="rounded-xl p-4"
                style={{ background: "#1A0F0A", border: "1px solid #3D2E26" }}
              >
                <p className="text-xs tracking-[0.1em] uppercase mb-2" style={{ color: "#8B6E52" }}>
                  {label}
                </p>
                <p
                  className="text-2xl font-light"
                  style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
                >
                  {value}
                </p>
                {sub && (
                  <p className="text-xs mt-1" style={{ color: "#8B6E52" }}>
                    {sub}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
