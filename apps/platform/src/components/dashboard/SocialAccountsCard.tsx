"use client";

import { useEffect, useState } from "react";
import {
  InstagramIcon,
  FacebookIcon,
  LinkedInIcon,
  TikTokIcon,
} from "./icons";

interface ConnectedAccount {
  platform: string;
  username: string;
  status: string;
}

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const PLATFORMS: SocialPlatform[] = [
  { id: "instagram", name: "Instagram", icon: <InstagramIcon size={18} />, color: "#E1306C" },
  { id: "facebook",  name: "Facebook",  icon: <FacebookIcon size={18} />,  color: "#1877F2" },
  { id: "linkedin",  name: "LinkedIn",  icon: <LinkedInIcon size={18} />,  color: "#0A66C2" },
  { id: "tiktok",    name: "TikTok",    icon: <TikTokIcon size={18} />,    color: "#FBF5ED" },
];

export function SocialAccountsCard() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetch("/api/social/accounts")
      .then((res) => (res.ok ? res.json() : { accounts: [] }))
      .then((data: { accounts: ConnectedAccount[] }) => setAccounts(data.accounts))
      .catch(() => {/* fail silently */})
      .finally(() => setLoading(false));
  }, []);

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/social/connect", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { portalUrl: string };
      window.location.href = data.portalUrl;
    } catch {
      setConnecting(false);
    }
  }

  function getAccount(platformId: string): ConnectedAccount | undefined {
    return accounts.find((a) => a.platform === platformId);
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
        style={{ background: "linear-gradient(90deg, #D4A853 0%, transparent 100%)" }}
      />

      <div className="p-5">
        <p className="text-sm tracking-[0.15em] uppercase mb-1.5" style={{ color: "#C4A882" }}>
          Connected Accounts
        </p>
        <h2
          className="text-2xl font-light mb-4"
          style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
        >
          Social Platforms
        </h2>

        <div className="space-y-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl px-3.5 py-3 animate-pulse"
                  style={{ background: "#1A0F0A", border: "1px solid #4A3728" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg" style={{ background: "#4A3728" }} />
                    <div>
                      <div className="w-20 h-3 rounded mb-2" style={{ background: "#4A3728" }} />
                      <div className="w-24 h-2.5 rounded" style={{ background: "#3A2A20" }} />
                    </div>
                  </div>
                  <div className="w-14 h-7 rounded-lg" style={{ background: "#4A3728" }} />
                </div>
              ))
            : PLATFORMS.map((platform) => {
                const connected = getAccount(platform.id);
                return (
                  <div
                    key={platform.id}
                    className="flex items-center justify-between rounded-xl px-3.5 py-3"
                    style={{
                      background: "#1A0F0A",
                      border: `1px solid ${connected ? "rgba(212,168,83,0.2)" : "#4A3728"}`,
                    }}
                  >
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
                          {platform.name}
                        </p>
                        {connected ? (
                          <p className="text-sm" style={{ color: "#C4A882" }}>
                            @{connected.username}
                          </p>
                        ) : (
                          <p className="text-sm" style={{ color: "#C4A882" }}>
                            Not connected
                          </p>
                        )}
                      </div>
                    </div>

                    {connected ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "#7DAF7D" }}
                        />
                        <span className="text-sm" style={{ color: "#7DAF7D" }}>
                          Active
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium tracking-wide transition-all active:scale-95"
                        style={{
                          background: "transparent",
                          border: "1px solid #4A3728",
                          color: "#C4A882",
                          cursor: connecting ? "wait" : "pointer",
                        }}
                      >
                        {connecting ? "…" : "Connect"}
                      </button>
                    )}
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
