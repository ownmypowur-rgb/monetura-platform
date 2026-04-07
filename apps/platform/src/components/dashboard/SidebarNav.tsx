"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  HomeIcon,
  CreateIcon,
  EarningsIcon,
  TravelIcon,
  CommunityIcon,
  SettingsIcon,
} from "./icons";

function LogOutIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ShieldIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: <HomeIcon size={18} /> },
  { id: "create", label: "Create", icon: <CreateIcon size={18} /> },
  { id: "earnings", label: "Earnings", icon: <EarningsIcon size={18} /> },
  { id: "travel", label: "Travel", icon: <TravelIcon size={18} /> },
  { id: "community", label: "Community", icon: <CommunityIcon size={18} /> },
];

interface SidebarNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  memberTier?: string;
}

export function SidebarNav({ activeTab, onTabChange, memberTier }: SidebarNavProps) {
  return (
    <aside
      className="hidden lg:flex flex-col w-60 flex-shrink-0 h-screen sticky top-0"
      style={{
        background: "#1A0F0A",
        borderRight: "1px solid #4A3728",
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-8 pb-8" style={{ borderBottom: "1px solid #4A3728" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #D4A853 0%, #C4973D 100%)" }}
          >
            <span
              className="text-xs font-bold tracking-wider"
              style={{ color: "#2C2420", fontFamily: "var(--font-heading)" }}
            >
              M
            </span>
          </div>
          <span
            className="text-base tracking-[0.25em] font-light"
            style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
          >
            MONETURA
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p
          className="px-3 mb-3 text-[10px] tracking-[0.2em] uppercase"
          style={{ color: "#C4A882" }}
        >
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
              style={{
                background: isActive ? "rgba(212,168,83,0.08)" : "transparent",
                border: isActive ? "1px solid rgba(212,168,83,0.15)" : "1px solid transparent",
                color: isActive ? "#D4A853" : "#E8DCCB",
              }}
            >
              <span>{item.icon}</span>
              <span
                className="text-base"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {item.label}
              </span>
              {isActive && (
                <span
                  className="ml-auto w-1 h-1 rounded-full"
                  style={{ background: "#D4A853" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin section — owner only */}
      {memberTier === "admin" && (
        <div className="px-3 pb-2" style={{ borderTop: "1px solid #4A3728", paddingTop: "12px" }}>
          <p
            className="px-3 mb-2 text-[10px] tracking-[0.2em] uppercase"
            style={{ color: "#C4A882" }}
          >
            Admin
          </p>
          <Link
            href="/admin/founders"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
            style={{
              background: activeTab === "admin" ? "rgba(212,168,83,0.08)" : "transparent",
              border: activeTab === "admin" ? "1px solid rgba(212,168,83,0.15)" : "1px solid transparent",
              color: activeTab === "admin" ? "#D4A853" : "#E8DCCB",
              textDecoration: "none",
              display: "flex",
            }}
          >
            <span><ShieldIcon size={18} /></span>
            <span className="text-sm" style={{ fontFamily: "var(--font-heading)" }}>
              Founders
            </span>
            {activeTab === "admin" && (
              <span className="ml-auto w-1 h-1 rounded-full" style={{ background: "#D4A853" }} />
            )}
          </Link>
        </div>
      )}

      {/* Bottom: settings + sign out + membership tier */}
      <div className="px-3 pb-6" style={{ borderTop: "1px solid #4A3728", paddingTop: "16px" }}>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
          style={{ color: "#E8DCCB" }}
        >
          <SettingsIcon size={18} />
          <span className="text-base" style={{ fontFamily: "var(--font-heading)" }}>
            Settings
          </span>
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
          style={{ color: "#E8DCCB" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#C17A4A"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#E8DCCB"; }}
        >
          <LogOutIcon size={18} />
          <span className="text-base" style={{ fontFamily: "var(--font-heading)" }}>
            Sign Out
          </span>
        </button>

        {/* Tier badge */}
        <div
          className="mx-3 mt-3 rounded-xl p-3"
          style={{
            background: "rgba(212,168,83,0.05)",
            border: "1px solid rgba(212,168,83,0.15)",
          }}
        >
          <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "#C4A882" }}>
            Membership
          </p>
          <p
            className="text-base font-semibold tracking-widest"
            style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
          >
            {(memberTier ?? "free").toUpperCase()}
          </p>
        </div>
      </div>
    </aside>
  );
}
