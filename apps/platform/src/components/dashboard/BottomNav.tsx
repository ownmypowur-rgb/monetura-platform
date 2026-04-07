"use client";

import Link from "next/link";
import {
  HomeIcon,
  CreateIcon,
  EarningsIcon,
  TravelIcon,
  CommunityIcon,
} from "./icons";

function PostsIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

interface NavTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
}

const TABS: NavTab[] = [
  { id: "home", label: "Home", icon: <HomeIcon size={22} /> },
  { id: "create", label: "Create", icon: <CreateIcon size={22} /> },
  { id: "posts", label: "Posts", icon: <PostsIcon size={22} />, href: "/posts" },
  { id: "travel", label: "Travel", icon: <TravelIcon size={22} /> },
  { id: "community", label: "Community", icon: <CommunityIcon size={22} /> },
];

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 lg:hidden z-50"
      style={{
        background: "rgba(26, 15, 10, 0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid #4A3728",
      }}
    >
      {/* Thin gold line at very top of nav */}
      <div
        className="h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #D4A85360 50%, transparent 100%)",
        }}
      />

      <div className="flex items-stretch" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const inner = (
            <>
              {isActive && (
                <span
                  className="absolute -top-px w-8 h-0.5 rounded-full"
                  style={{ background: "#D4A853" }}
                />
              )}
              <span className="relative">{tab.icon}</span>
              <span
                className="text-xs tracking-wide"
                style={{
                  color: isActive ? "#D4A853" : "#E8DCCB",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {tab.label}
              </span>
            </>
          );

          if (tab.href) {
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:scale-95"
                style={{ color: "#E8DCCB", textDecoration: "none" }}
                aria-label={tab.label}
              >
                {inner}
              </Link>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:scale-95"
              style={{ color: isActive ? "#D4A853" : "#E8DCCB" }}
              aria-label={tab.label}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
