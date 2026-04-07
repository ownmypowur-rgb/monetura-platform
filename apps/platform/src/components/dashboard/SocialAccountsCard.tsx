"use client";

import {
  InstagramIcon,
  FacebookIcon,
  LinkedInIcon,
  TikTokIcon,
} from "./icons";

interface SocialPlatform {
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  handle: string | null;
  color: string;
}

const PLATFORMS: SocialPlatform[] = [
  {
    name: "Instagram",
    icon: <InstagramIcon size={18} />,
    connected: true,
    handle: "@sarah.explores",
    color: "#E1306C",
  },
  {
    name: "Facebook",
    icon: <FacebookIcon size={18} />,
    connected: false,
    handle: null,
    color: "#1877F2",
  },
  {
    name: "LinkedIn",
    icon: <LinkedInIcon size={18} />,
    connected: false,
    handle: null,
    color: "#0A66C2",
  },
  {
    name: "TikTok",
    icon: <TikTokIcon size={18} />,
    connected: false,
    handle: null,
    color: "#FBF5ED",
  },
];

export function SocialAccountsCard() {
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
          {PLATFORMS.map((platform) => (
            <div
              key={platform.name}
              className="flex items-center justify-between rounded-xl px-3.5 py-3"
              style={{
                background: "#1A0F0A",
                border: `1px solid ${platform.connected ? "rgba(212,168,83,0.2)" : "#4A3728"}`,
              }}
            >
              <div className="flex items-center gap-3">
                {/* Platform icon */}
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                  style={{
                    background: platform.connected
                      ? `${platform.color}15`
                      : "#2C2420",
                    border: `1px solid ${platform.connected ? `${platform.color}30` : "#4A3728"}`,
                    color: platform.connected ? platform.color : "#8B6E52",
                  }}
                >
                  {platform.icon}
                </div>

                {/* Name + handle */}
                <div>
                  <p className="text-base font-medium" style={{ color: "#FBF5ED" }}>
                    {platform.name}
                  </p>
                  {platform.connected && platform.handle ? (
                    <p className="text-sm" style={{ color: "#C4A882" }}>
                      {platform.handle}
                    </p>
                  ) : (
                    <p className="text-sm" style={{ color: "#C4A882" }}>
                      Not connected
                    </p>
                  )}
                </div>
              </div>

              {/* Status / CTA */}
              {platform.connected ? (
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
                  className="px-3 py-1.5 rounded-lg text-sm font-medium tracking-wide transition-all active:scale-95"
                  style={{
                    background: "transparent",
                    border: "1px solid #4A3728",
                    color: "#C4A882",
                  }}
                >
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
