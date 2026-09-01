"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  CreateIcon,
  EarningsIcon,
  TravelIcon,
  CommunityIcon,
} from "./icons";

// Every tab is a real link. "More" opens a sheet with the remaining sections
// so Events, Marketplace, Posts, and Settings are reachable on mobile.
const TABS = [
  { id: "home", label: "Home", href: "/dashboard", icon: <HomeIcon size={22} /> },
  { id: "create", label: "Create", href: "/create", icon: <CreateIcon size={22} /> },
  { id: "earnings", label: "Earnings", href: "/earnings", icon: <EarningsIcon size={22} /> },
  { id: "travel", label: "Travel", href: "/travel", icon: <TravelIcon size={22} /> },
] as const;

const MORE_LINKS = [
  { label: "Events", href: "/events" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Posts", href: "/posts" },
  { label: "Settings", href: "/settings/social" },
] as const;

interface BottomNavProps {
  /** Legacy props — navigation is now pathname-driven. */
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function BottomNav(_props: BottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const moreActive = MORE_LINKS.some((l) => isActive(l.href));

  return (
    <>
      {/* More sheet */}
      {moreOpen && (
        <>
          <button
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(0,0,0,0.5)" }}
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="fixed bottom-[68px] left-3 right-3 z-50 rounded-2xl overflow-hidden lg:hidden"
            style={{
              background: "#2C2420",
              border: "1px solid #4A3728",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
              marginBottom: "env(safe-area-inset-bottom)",
            }}
          >
            {MORE_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMoreOpen(false)}
                className="flex items-center justify-between px-5 py-4"
                style={{
                  color: isActive(link.href) ? "#D4A853" : "#E8DCCB",
                  textDecoration: "none",
                  fontFamily: "var(--font-heading)",
                  borderTop: i > 0 ? "1px solid #3D2E26" : "none",
                }}
              >
                <span className="text-base">{link.label}</span>
                <span style={{ color: "#8B6E52" }}>→</span>
              </Link>
            ))}
          </div>
        </>
      )}

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

        <div
          className="flex items-stretch"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {TABS.map((tab) => {
            const active = isActive(tab.href) && !moreOpen;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={() => setMoreOpen(false)}
                className="relative flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:scale-95"
                style={{
                  color: active ? "#D4A853" : "#E8DCCB",
                  textDecoration: "none",
                }}
                aria-label={tab.label}
              >
                {active && (
                  <span
                    className="absolute top-0 w-8 h-0.5 rounded-full"
                    style={{ background: "#D4A853" }}
                  />
                )}
                <span className="relative">{tab.icon}</span>
                <span
                  className="text-xs tracking-wide"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* More */}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="relative flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:scale-95"
            style={{ color: moreOpen || moreActive ? "#D4A853" : "#E8DCCB" }}
            aria-label="More"
            aria-expanded={moreOpen}
          >
            {(moreOpen || moreActive) && (
              <span
                className="absolute top-0 w-8 h-0.5 rounded-full"
                style={{ background: "#D4A853" }}
              />
            )}
            <span className="relative">
              <CommunityIcon size={22} />
            </span>
            <span
              className="text-xs tracking-wide"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
