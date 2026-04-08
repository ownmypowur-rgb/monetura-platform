"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ConnectedAccount {
  platform: string;
  username: string;
  status: string;
}

interface PlatformConfig {
  id: string;
  label: string;
  color: string;
  icon: React.ReactNode;
}

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}

function LinkedInIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.26 8.26 0 004.83 1.56V6.79a4.85 4.85 0 01-1.06-.1z" />
    </svg>
  );
}

const PLATFORMS: PlatformConfig[] = [
  { id: "instagram", label: "Instagram", color: "#E1306C", icon: <InstagramIcon /> },
  { id: "facebook",  label: "Facebook",  color: "#1877F2", icon: <FacebookIcon /> },
  { id: "linkedin",  label: "LinkedIn",  color: "#0A66C2", icon: <LinkedInIcon /> },
  { id: "tiktok",    label: "TikTok",    color: "#FBF5ED", icon: <TikTokIcon /> },
];

export default function SocialSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/social/accounts");
      if (res.ok) {
        const data = (await res.json()) as { accounts: ConnectedAccount[] };
        setAccounts(data.accounts);
      }
    } catch {
      // fail silently — no accounts shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  // Handle return from bundle.social portal
  useEffect(() => {
    if (searchParams.get("connected") === "true") {
      setToast("Social accounts connected successfully!");
      // Remove query param without a full navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      router.replace(url.pathname, { scroll: false });
      // Refresh the accounts list
      void fetchAccounts();
    }
  }, [searchParams, router, fetchAccounts]);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function openPortal() {
    setConnecting(true);
    try {
      const res = await fetch("/api/social/connect", { method: "POST" });
      if (!res.ok) throw new Error("Failed to get portal URL");
      const data = (await res.json()) as { portalUrl: string };
      window.location.href = data.portalUrl;
    } catch {
      setToast("Could not open the connection portal. Please try again.");
      setConnecting(false);
    }
  }

  function getConnectedAccount(platformId: string): ConnectedAccount | undefined {
    return accounts.find((a) => a.platform === platformId);
  }

  return (
    <div className="min-h-screen px-4 py-8 lg:px-10 lg:py-10" style={{ color: "#FBF5ED" }}>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg transition-all"
          style={{
            background: "#2C2420",
            border: "1px solid rgba(212,168,83,0.4)",
            color: "#D4A853",
            maxWidth: "90vw",
          }}
        >
          {toast}
        </div>
      )}

      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-70"
        style={{ color: "#C4A882", textDecoration: "none" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs tracking-[0.2em] uppercase mb-1.5" style={{ color: "#C4A882" }}>
          Settings
        </p>
        <h1
          className="text-3xl font-light mb-2"
          style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
        >
          Social Accounts
        </h1>
        <p className="text-sm" style={{ color: "#8B6E52" }}>
          Connect your social media accounts to publish content automatically
        </p>
      </div>

      {/* Platform cards */}
      <div
        className="rounded-2xl overflow-hidden mb-6"
        style={{ background: "#2C2420", border: "1px solid #4A3728" }}
      >
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(90deg, #D4A853 0%, transparent 100%)" }}
        />

        <div className="p-5 space-y-3">
          {loading ? (
            // Skeleton loading state
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl px-3.5 py-3 animate-pulse"
                style={{ background: "#1A0F0A", border: "1px solid #4A3728" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg" style={{ background: "#4A3728" }} />
                  <div>
                    <div className="w-20 h-3.5 rounded mb-1.5" style={{ background: "#4A3728" }} />
                    <div className="w-28 h-3 rounded" style={{ background: "#3A2A20" }} />
                  </div>
                </div>
                <div className="w-16 h-8 rounded-lg" style={{ background: "#4A3728" }} />
              </div>
            ))
          ) : (
            PLATFORMS.map((platform) => {
              const connected = getConnectedAccount(platform.id);
              return (
                <div
                  key={platform.id}
                  className="flex items-center justify-between rounded-xl px-3.5 py-3"
                  style={{
                    background: "#1A0F0A",
                    border: `1px solid ${connected ? "rgba(212,168,83,0.2)" : "#4A3728"}`,
                  }}
                >
                  {/* Icon + name + handle */}
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                      style={{
                        background: connected ? `${platform.color}15` : "#2C2420",
                        border: `1px solid ${connected ? `${platform.color}30` : "#4A3728"}`,
                        color: connected ? platform.color : "#8B6E52",
                      }}
                    >
                      {platform.icon}
                    </div>

                    <div>
                      <p className="text-base font-medium" style={{ color: "#FBF5ED" }}>
                        {platform.label}
                      </p>
                      {connected ? (
                        <p className="text-sm flex items-center gap-1.5" style={{ color: "#7DAF7D" }}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#7DAF7D" }} />
                          @{connected.username}
                        </p>
                      ) : (
                        <p className="text-sm" style={{ color: "#8B6E52" }}>
                          Not connected
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  {connected ? (
                    <button
                      onClick={openPortal}
                      disabled={connecting}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium tracking-wide transition-all active:scale-95"
                      style={{
                        background: "transparent",
                        border: "1px solid #4A3728",
                        color: "#8B6E52",
                        cursor: connecting ? "wait" : "pointer",
                      }}
                    >
                      Manage
                    </button>
                  ) : (
                    <button
                      onClick={openPortal}
                      disabled={connecting}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium tracking-wide transition-all active:scale-95"
                      style={{
                        background: connecting
                          ? "rgba(212,168,83,0.15)"
                          : "linear-gradient(135deg, #D4A853 0%, #C4973D 100%)",
                        border: "none",
                        color: connecting ? "#C4A882" : "#2C2420",
                        cursor: connecting ? "wait" : "pointer",
                      }}
                    >
                      {connecting ? "Opening…" : "Connect"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Connect all button */}
      <button
        onClick={openPortal}
        disabled={connecting || loading}
        className="w-full py-3.5 rounded-xl font-medium tracking-wider text-sm transition-all active:scale-[0.99]"
        style={{
          background:
            connecting || loading
              ? "rgba(212,168,83,0.15)"
              : "linear-gradient(135deg, #D4A853 0%, #C4973D 100%)",
          color: connecting || loading ? "#C4A882" : "#2C2420",
          fontFamily: "var(--font-heading)",
          border: "none",
          cursor: connecting || loading ? "wait" : "pointer",
        }}
      >
        {connecting ? "Opening portal…" : "Connect Social Accounts"}
      </button>

      <p className="mt-3 text-xs text-center" style={{ color: "#8B6E52" }}>
        You&apos;ll be taken to a secure portal to connect your accounts. You&apos;ll return here automatically.
      </p>
    </div>
  );
}
