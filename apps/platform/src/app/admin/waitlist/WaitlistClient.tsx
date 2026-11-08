"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SidebarNav } from "@/components/dashboard/SidebarNav";

export interface WaitlistListRow {
  id: number;
  firstName: string;
  email: string;
  status: "subscribed" | "unsubscribed";
  joined: string;
  confirmationSent: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
}

interface Props {
  stats: { subscribed: number; unsubscribed: number; lastSevenDays: number; pendingConfirmation: number };
  rows: WaitlistListRow[];
  page: number;
  hasNext: boolean;
  sendBlockedReason: string | null;
}

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "—";

export function WaitlistClient({ stats, rows, page, hasNext, sendBlockedReason }: Props) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const sendPending = async () => {
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/waitlist/send-pending", { method: "POST" });
      const data = (await res.json()) as { attempted?: number; sent?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setMessage(`Sent ${data.sent ?? 0} of ${data.attempted ?? 0} pending confirmations.`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  const tiles = [
    { label: "Subscribed", value: stats.subscribed },
    { label: "Unsubscribed", value: stats.unsubscribed },
    { label: "Joined, last 7 days", value: stats.lastSevenDays },
    { label: "Waiting for confirmation email", value: stats.pendingConfirmation },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#2C2420" }}>
      <div className="lg:flex lg:h-screen">
        <SidebarNav activeTab="waitlist" onTabChange={() => {}} memberTier="admin" />

        <div className="flex-1 flex flex-col lg:overflow-hidden">
          <div className="flex items-center gap-4 px-5 pt-12 pb-5 lg:pt-6 lg:px-8" style={{ borderBottom: "1px solid #3D2E26" }}>
            <Link href="/dashboard" className="text-sm transition-colors lg:hidden" style={{ color: "#C4A882" }}>
              ← Dashboard
            </Link>
            <div>
              <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: "#C4A882" }}>
                Admin Console
              </p>
              <h1 className="text-2xl lg:text-3xl font-light" style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}>
                Waitlist
              </h1>
              <p className="text-sm mt-1" style={{ color: "#B99B74" }}>
                Signups from monetura.com/waitlist. Personal data: keep it inside Monetura.
              </p>
            </div>
          </div>

          <main className="flex-1 lg:overflow-y-auto pb-10">
            <div className="px-4 lg:px-8 py-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tiles.map((t) => (
                  <div key={t.label} className="rounded-2xl px-5 py-4" style={{ background: "#1A0F0A", border: "1px solid #3D2E26" }}>
                    <p className="text-2xl font-light" style={{ color: "#D4A853" }}>{t.value}</p>
                    <p className="text-xs mt-1" style={{ color: "#B99B74" }}>{t.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/api/admin/waitlist/csv"
                  className="rounded-xl px-4 py-2.5 text-sm"
                  style={{ background: "#D4A853", color: "#2C2420" }}
                >
                  Download CSV
                </a>
                <button
                  type="button"
                  onClick={sendPending}
                  disabled={sending || Boolean(sendBlockedReason) || stats.pendingConfirmation === 0}
                  className="rounded-xl px-4 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ border: "1px solid #D4A853", color: "#D4A853" }}
                >
                  {sending ? "Sending…" : `Send pending confirmations (${stats.pendingConfirmation})`}
                </button>
                {sendBlockedReason && <p className="text-xs" style={{ color: "#C17A4A" }}>{sendBlockedReason}</p>}
                {message && <p role="status" className="text-xs" style={{ color: "#E8DCCB" }}>{message}</p>}
              </div>

              <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid #3D2E26" }}>
                <table className="w-full text-sm" style={{ color: "#E8DCCB" }}>
                  <thead>
                    <tr style={{ background: "#1A0F0A", color: "#C4A882" }}>
                      {["First name", "Email", "Joined", "Status", "Confirmation sent", "Source", "Medium", "Campaign", "Referrer"].map((h) => (
                        <th key={h} className="text-left font-normal text-xs uppercase tracking-[0.12em] px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr><td colSpan={9} className="px-4 py-8 text-center" style={{ color: "#B99B74" }}>No signups yet.</td></tr>
                    )}
                    {rows.map((r) => (
                      <tr key={r.id} style={{ borderTop: "1px solid #3D2E26" }}>
                        <td className="px-4 py-3">{r.firstName}</td>
                        <td className="px-4 py-3">{r.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{fmt(r.joined)}</td>
                        <td className="px-4 py-3" style={{ color: r.status === "subscribed" ? "#D4A853" : "#8B6E52" }}>{r.status}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{fmt(r.confirmationSent)}</td>
                        <td className="px-4 py-3">{r.utmSource ?? "—"}</td>
                        <td className="px-4 py-3">{r.utmMedium ?? "—"}</td>
                        <td className="px-4 py-3">{r.utmCampaign ?? "—"}</td>
                        <td className="px-4 py-3 max-w-[16rem] truncate" title={r.referrer ?? ""}>{r.referrer ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-4 text-sm" style={{ color: "#C4A882" }}>
                {page > 1 && <Link href={`/admin/waitlist?page=${page - 1}`}>← Newer</Link>}
                {hasNext && <Link href={`/admin/waitlist?page=${page + 1}`}>Older →</Link>}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
