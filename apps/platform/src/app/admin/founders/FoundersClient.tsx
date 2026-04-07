"use client";

import { useState } from "react";
import Link from "next/link";
import { SidebarNav } from "@/components/dashboard/SidebarNav";

// ── Types ────────────────────────────────────────────────────────────────────

type TierInterest = "entry" | "core" | "elite" | "platinum";
type MemberStatus = "pending" | "awaiting_payment" | "active" | "suspended" | "cancelled";
type MembershipTier = "free" | "community" | "software" | "founder" | "admin";

interface ApplicationMember {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  province: string | null;
  country: string | null;
  tierInterest: TierInterest | null;
  heardAbout: string | null;
  status: MemberStatus;
  membershipTier: MembershipTier;
  founderNumber: number | null;
  createdAt: Date;
}

interface FoundersData {
  pending: ApplicationMember[];
  awaitingPayment: ApplicationMember[];
  active: ApplicationMember[];
  stats: {
    total: number;
    pending: number;
    awaitingPayment: number;
    active: number;
  };
}

interface FoundersClientProps {
  initialData: FoundersData;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<TierInterest, string> = {
  entry: "Entry Founder",
  core: "Core Founder",
  elite: "Elite Founder",
  platinum: "Platinum Founder",
};

const TIER_COLORS: Record<TierInterest, string> = {
  entry: "#8B6E52",
  core: "#C17A4A",
  elite: "#D4A853",
  platinum: "#FBF5ED",
};

function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    pending: { label: "Pending Review", bg: "rgba(139,110,82,0.15)", color: "#C17A4A" },
    awaiting_payment: { label: "Awaiting Payment", bg: "rgba(212,168,83,0.12)", color: "#D4A853" },
    active: { label: "Active", bg: "rgba(34,197,94,0.12)", color: "#4ade80" },
    suspended: { label: "Suspended", bg: "rgba(220,38,38,0.12)", color: "#f87171" },
    cancelled: { label: "Cancelled", bg: "rgba(100,116,139,0.12)", color: "#94a3b8" },
  };
  const c = config[status] ?? { label: status, bg: "rgba(100,116,139,0.12)", color: "#94a3b8" };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}

// ── Application Card ─────────────────────────────────────────────────────────

interface ApplicationCardProps {
  member: ApplicationMember;
  onSendInstructions?: (id: number) => Promise<void>;
  onOpenConfirm?: (member: ApplicationMember) => void;
  loadingId: number | null;
  successId: number | null;
}

function ApplicationCard({
  member,
  onSendInstructions,
  onOpenConfirm,
  loadingId,
  successId,
}: ApplicationCardProps) {
  const isLoading = loadingId === member.id;
  const isSuccess = successId === member.id;
  const isPending = member.status === "pending";
  const isAwaiting = member.status === "awaiting_payment";

  return (
    <div
      className="rounded-2xl p-5 space-y-4 transition-all"
      style={{
        background: "#1A0F0A",
        border: "1px solid #3D2E26",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-base" style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}>
            {member.name}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "#8B6E52" }}>
            {member.email}
          </p>
          {member.phone && (
            <p className="text-xs mt-0.5" style={{ color: "#4A3728" }}>
              {member.phone}
            </p>
          )}
        </div>
        <StatusBadge status={member.status} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {(member.province ?? member.country) && (
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "#4A3728" }}>
              Province / Region
            </p>
            <p style={{ color: "#E8DCCB" }}>{member.province ?? member.country}</p>
          </div>
        )}

        {member.tierInterest && (
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "#4A3728" }}>
              Tier Interest
            </p>
            <p
              className="font-medium"
              style={{ color: TIER_COLORS[member.tierInterest] }}
            >
              {TIER_LABELS[member.tierInterest]}
            </p>
          </div>
        )}

        <div>
          <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "#4A3728" }}>
            Submitted
          </p>
          <p style={{ color: "#E8DCCB" }}>{formatDate(member.createdAt)}</p>
        </div>

        {member.heardAbout && (
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "#4A3728" }}>
              How they heard
            </p>
            <p style={{ color: "#E8DCCB" }}>{member.heardAbout}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {isPending && onSendInstructions && (
        <button
          onClick={() => onSendInstructions(member.id)}
          disabled={isLoading || isSuccess}
          className="w-full py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: isSuccess ? "rgba(74,222,128,0.12)" : "#D4A853",
            color: isSuccess ? "#4ade80" : "#2C2420",
            fontFamily: "var(--font-heading)",
            border: isSuccess ? "1px solid rgba(74,222,128,0.25)" : "none",
          }}
        >
          {isLoading ? "Sending…" : isSuccess ? "✓ Instructions Sent" : "Send Payment Instructions"}
        </button>
      )}

      {isAwaiting && onOpenConfirm && (
        <button
          onClick={() => onOpenConfirm(member)}
          className="w-full py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all"
          style={{
            background: "rgba(74,222,128,0.1)",
            color: "#4ade80",
            border: "1px solid rgba(74,222,128,0.2)",
            fontFamily: "var(--font-heading)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(74,222,128,0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(74,222,128,0.1)";
          }}
        >
          Confirm Payment Received
        </button>
      )}
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  member: ApplicationMember;
  onConfirm: (memberId: number, tierOverride: TierInterest) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

function ConfirmModal({ member, onConfirm, onClose, loading }: ConfirmModalProps) {
  const [selectedTier, setSelectedTier] = useState<TierInterest>(
    member.tierInterest ?? "entry"
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{
          background: "#1A0F0A",
          border: "1px solid #3D2E26",
          boxShadow: "0 25px 50px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div>
          <h2
            className="text-xl font-light mb-1"
            style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
          >
            Confirm Payment
          </h2>
          <p style={{ color: "#8B6E52", fontSize: "14px" }}>
            Activating founder account for{" "}
            <span style={{ color: "#D4A853" }}>{member.name}</span>
          </p>
        </div>

        {/* Tier selector */}
        <div>
          <label
            className="block text-xs tracking-widest uppercase mb-2"
            style={{ color: "#8B6E52" }}
          >
            Founder Tier
          </label>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as TierInterest)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: "#2C2420",
              color: "#FBF5ED",
              border: "1px solid #4A3728",
              fontFamily: "var(--font-heading)",
            }}
          >
            <option value="entry">Entry Founder</option>
            <option value="core">Core Founder</option>
            <option value="elite">Elite Founder</option>
            <option value="platinum">Platinum Founder</option>
          </select>
        </div>

        {/* Info box */}
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{
            background: "rgba(212,168,83,0.06)",
            border: "1px solid rgba(212,168,83,0.15)",
            color: "#8B6E52",
          }}
        >
          This will activate the account, assign a founder number, and send a
          welcome email. The n8n onboarding workflow will fire automatically.
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all"
            style={{
              background: "transparent",
              color: "#8B6E52",
              border: "1px solid #3D2E26",
              fontFamily: "var(--font-heading)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(member.id, selectedTier)}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all disabled:opacity-50"
            style={{
              background: loading ? "rgba(74,222,128,0.08)" : "rgba(74,222,128,0.12)",
              color: "#4ade80",
              border: "1px solid rgba(74,222,128,0.25)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {loading ? "Activating…" : "Activate Founder"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Active Founders Table ─────────────────────────────────────────────────────

function ActiveFoundersTable({ founders }: { founders: ApplicationMember[] }) {
  if (founders.length === 0) {
    return (
      <div
        className="rounded-2xl px-6 py-16 text-center"
        style={{ background: "#1A0F0A", border: "1px solid #3D2E26" }}
      >
        <p className="text-sm" style={{ color: "#4A3728" }}>
          No active founders yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid #3D2E26" }}
    >
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#140C08", borderBottom: "1px solid #3D2E26" }}>
              {["Founder #", "Name", "Email", "Tier", "Joined", "Status"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-left text-[10px] tracking-widest uppercase"
                    style={{ color: "#4A3728", fontFamily: "var(--font-heading)" }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {founders.map((f, i) => (
              <tr
                key={f.id}
                style={{
                  background: i % 2 === 0 ? "#1A0F0A" : "rgba(255,255,255,0.01)",
                  borderBottom: "1px solid #3D2E26",
                }}
              >
                <td className="px-5 py-4">
                  <span
                    className="font-bold text-base"
                    style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
                  >
                    #{f.founderNumber}
                  </span>
                </td>
                <td className="px-5 py-4" style={{ color: "#FBF5ED" }}>
                  {f.name}
                </td>
                <td className="px-5 py-4" style={{ color: "#8B6E52" }}>
                  {f.email}
                </td>
                <td className="px-5 py-4">
                  {f.tierInterest ? (
                    <span style={{ color: TIER_COLORS[f.tierInterest] }}>
                      {TIER_LABELS[f.tierInterest]}
                    </span>
                  ) : (
                    <span style={{ color: "#4A3728" }}>—</span>
                  )}
                </td>
                <td className="px-5 py-4" style={{ color: "#8B6E52" }}>
                  {formatDate(f.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={f.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y" style={{ borderColor: "#3D2E26" }}>
        {founders.map((f) => (
          <div key={f.id} className="p-4 space-y-2" style={{ background: "#1A0F0A" }}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-xl" style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}>
                #{f.founderNumber}
              </span>
              <StatusBadge status={f.status} />
            </div>
            <p className="font-medium" style={{ color: "#FBF5ED" }}>{f.name}</p>
            <p className="text-sm" style={{ color: "#8B6E52" }}>{f.email}</p>
            {f.tierInterest && (
              <p className="text-sm" style={{ color: TIER_COLORS[f.tierInterest] }}>
                {TIER_LABELS[f.tierInterest]}
              </p>
            )}
            <p className="text-xs" style={{ color: "#4A3728" }}>
              Joined {formatDate(f.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function FoundersClient({ initialData }: FoundersClientProps) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<"pending" | "awaiting" | "active">(
    "pending"
  );
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [successIds, setSuccessIds] = useState<Set<number>>(new Set());
  const [confirmMember, setConfirmMember] = useState<ApplicationMember | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function refreshData() {
    try {
      const res = await fetch("/api/admin/founders");
      if (res.ok) {
        const freshData = (await res.json()) as FoundersData;
        setData(freshData);
      }
    } catch {
      // Non-critical
    }
  }

  async function handleSendInstructions(memberId: number) {
    setLoadingId(memberId);
    try {
      const res = await fetch(
        `/api/admin/founders/${memberId}/send-instructions`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        showToast(err.error ?? "Failed to send instructions", "error");
        return;
      }
      setSuccessIds((prev) => new Set(prev).add(memberId));
      showToast("Payment instructions sent.", "success");
      await refreshData();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleActivate(memberId: number, tierOverride: TierInterest) {
    setConfirmLoading(true);
    try {
      const res = await fetch(`/api/admin/founders/${memberId}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierOverride }),
      });
      const json = (await res.json()) as { success?: boolean; founderNumber?: number; error?: string };
      if (!res.ok) {
        showToast(json.error ?? "Activation failed", "error");
        return;
      }
      showToast(
        `Founder #${json.founderNumber} activated. Welcome email sent.`,
        "success"
      );
      setConfirmMember(null);
      await refreshData();
      setActiveTab("active");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setConfirmLoading(false);
    }
  }

  const TABS = [
    {
      id: "pending" as const,
      label: "Pending Review",
      count: data.stats.pending,
    },
    {
      id: "awaiting" as const,
      label: "Awaiting Payment",
      count: data.stats.awaitingPayment,
    },
    {
      id: "active" as const,
      label: "Active Founders",
      count: data.stats.active,
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#130D0A" }}>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-5 py-3.5 rounded-xl text-sm font-medium shadow-2xl"
          style={{
            background:
              toast.type === "success"
                ? "rgba(74,222,128,0.12)"
                : "rgba(220,38,38,0.12)",
            border:
              toast.type === "success"
                ? "1px solid rgba(74,222,128,0.25)"
                : "1px solid rgba(220,38,38,0.2)",
            color: toast.type === "success" ? "#4ade80" : "#f87171",
            backdropFilter: "blur(8px)",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Confirm modal */}
      {confirmMember && (
        <ConfirmModal
          member={confirmMember}
          onConfirm={handleActivate}
          onClose={() => setConfirmMember(null)}
          loading={confirmLoading}
        />
      )}

      {/* Layout */}
      <div className="lg:flex lg:h-screen">
        {/* Sidebar — desktop */}
        <SidebarNav
          activeTab="admin"
          onTabChange={() => {}}
          memberTier="admin"
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col lg:overflow-hidden">
          {/* Top bar */}
          <div
            className="flex items-center gap-4 px-5 pt-12 pb-5 lg:pt-6 lg:px-8"
            style={{ borderBottom: "1px solid #3D2E26" }}
          >
            <Link
              href="/dashboard"
              className="text-sm transition-colors lg:hidden"
              style={{ color: "#8B6E52" }}
            >
              ← Dashboard
            </Link>
            <div>
              <p
                className="text-xs tracking-[0.2em] uppercase mb-1"
                style={{ color: "#8B6E52" }}
              >
                Admin Console
              </p>
              <h1
                className="text-2xl lg:text-3xl font-light"
                style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
              >
                Founder Applications
              </h1>
              <p className="text-sm mt-1" style={{ color: "#4A3728" }}>
                Manage incoming applications and activate founder accounts
              </p>
            </div>
          </div>

          {/* Scrollable content */}
          <main className="flex-1 lg:overflow-y-auto pb-10">
            <div className="px-4 lg:px-8 py-6 space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Total Applications", value: data.stats.total },
                  { label: "Pending Review", value: data.stats.pending },
                  { label: "Awaiting Payment", value: data.stats.awaitingPayment },
                  { label: "Active Founders", value: data.stats.active },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl px-5 py-4"
                    style={{
                      background: "#1A0F0A",
                      border: "1px solid #3D2E26",
                    }}
                  >
                    <p
                      className="text-3xl font-light mb-1"
                      style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
                    >
                      {stat.value}
                    </p>
                    <p
                      className="text-[11px] tracking-wide uppercase"
                      style={{ color: "#4A3728" }}
                    >
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div
                className="flex gap-1 p-1 rounded-xl"
                style={{ background: "#1A0F0A", border: "1px solid #3D2E26" }}
              >
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: isActive
                          ? "rgba(212,168,83,0.1)"
                          : "transparent",
                        color: isActive ? "#D4A853" : "#8B6E52",
                        border: isActive
                          ? "1px solid rgba(212,168,83,0.2)"
                          : "1px solid transparent",
                        fontFamily: "var(--font-heading)",
                      }}
                    >
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden text-xs">{tab.label.split(" ")[0]}</span>
                      {tab.count > 0 && (
                        <span
                          className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                          style={{
                            background: isActive
                              ? "#D4A853"
                              : "rgba(212,168,83,0.15)",
                            color: isActive ? "#2C2420" : "#D4A853",
                          }}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              {activeTab === "pending" && (
                <div className="space-y-3">
                  {data.pending.length === 0 ? (
                    <div
                      className="rounded-2xl px-6 py-16 text-center"
                      style={{ background: "#1A0F0A", border: "1px solid #3D2E26" }}
                    >
                      <p className="text-sm" style={{ color: "#4A3728" }}>
                        No pending applications.
                      </p>
                    </div>
                  ) : (
                    data.pending.map((member) => (
                      <ApplicationCard
                        key={member.id}
                        member={member}
                        onSendInstructions={handleSendInstructions}
                        loadingId={loadingId}
                        successId={successIds.has(member.id) ? member.id : null}
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === "awaiting" && (
                <div className="space-y-3">
                  {data.awaitingPayment.length === 0 ? (
                    <div
                      className="rounded-2xl px-6 py-16 text-center"
                      style={{ background: "#1A0F0A", border: "1px solid #3D2E26" }}
                    >
                      <p className="text-sm" style={{ color: "#4A3728" }}>
                        No applications awaiting payment.
                      </p>
                    </div>
                  ) : (
                    data.awaitingPayment.map((member) => (
                      <ApplicationCard
                        key={member.id}
                        member={member}
                        onOpenConfirm={setConfirmMember}
                        loadingId={loadingId}
                        successId={null}
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === "active" && (
                <ActiveFoundersTable founders={data.active} />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
