"use client";

import { BellIcon } from "./icons";
import type { DashboardUser } from "./types";

interface TopBarProps {
  user: DashboardUser;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getFirstName(name: string): string {
  return name.split(" ")[0] ?? name;
}

export function TopBar({ user }: TopBarProps) {
  const greeting = getGreeting();
  const initials = getInitials(user.name);
  const firstName = getFirstName(user.name);
  const isFounder = user.memberTier === "founder";

  return (
    <header
      className="flex items-center justify-between px-5 pt-12 pb-4 lg:pt-6 lg:px-8"
      style={{ background: "transparent" }}
    >
      {/* Left: greeting + badge */}
      <div>
        <p className="text-xs tracking-[0.18em] uppercase mb-1" style={{ color: "#C4A882" }}>
          {greeting}
        </p>
        <div className="flex items-center gap-2.5">
          <h1
            className="text-2xl lg:text-3xl font-light"
            style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
          >
            {firstName}
          </h1>
          {isFounder && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-[0.15em] uppercase"
              style={{
                background: "linear-gradient(135deg, #D4A853 0%, #C4973D 100%)",
                color: "#2C2420",
              }}
            >
              {user.founderNumber !== null ? `Founder #${user.founderNumber}` : "Founder"}
            </span>
          )}
        </div>
      </div>

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-3">
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors"
          style={{ background: "#2C2420", color: "#C4A882" }}
          aria-label="Notifications"
        >
          <BellIcon size={18} />
          {/* Notification dot */}
          <span
            className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
            style={{ background: "#D4A853" }}
          />
        </button>

        <button
          className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold tracking-wide"
          style={{
            background: "linear-gradient(135deg, #4A3728 0%, #2C2420 100%)",
            border: "1px solid #D4A853",
            color: "#D4A853",
            fontFamily: "var(--font-heading)",
          }}
          aria-label="Profile"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
