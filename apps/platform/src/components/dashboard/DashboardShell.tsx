"use client";

import { useState } from "react";
import { TopBar } from "./TopBar";
import { StatsBar } from "./StatsBar";
import { ContentCreatorCard } from "./ContentCreatorCard";
import { EarningsHubCard } from "./EarningsHubCard";
import { TravelCard } from "./TravelCard";
import { SocialAccountsCard } from "./SocialAccountsCard";
import { CommunityCard } from "./CommunityCard";
import { RecentPostsCard } from "./RecentPostsCard";
import { BottomNav } from "./BottomNav";
import { SidebarNav } from "./SidebarNav";
import { EventsWidget } from "./EventsWidget";
import { TripSavingsCalculator } from "./TripSavingsCalculator";
import { ConciergeWidget } from "@/components/concierge/ConciergeWidget";
import type { DashboardUser } from "./types";

interface DashboardShellProps {
  user: DashboardUser;
}

export function DashboardShell({ user }: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div
      className="min-h-screen"
      style={{ background: "#130D0A" }}
    >
      {/* Desktop layout: sidebar + main */}
      <div className="lg:flex lg:h-screen">
        {/* Sidebar (desktop only) */}
        <SidebarNav activeTab={activeTab} onTabChange={setActiveTab} memberTier={user.memberTier} />

        {/* Main content column */}
        <div className="flex-1 flex flex-col lg:overflow-hidden">
          {/* Top bar */}
          <TopBar user={user} />

          {/* Scrollable content */}
          <main className="flex-1 lg:overflow-y-auto pb-28 lg:pb-10">
            {/* Stats bar */}
            <StatsBar
              creditsRemaining={user.creditsRemaining}
              creditsTotal={user.creditsTotal}
            />

            {/* Cards grid */}
            <div className="px-4 lg:px-8 mt-4 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4">
              <ContentCreatorCard />
              <EarningsHubCard />
              <TravelCard />
              <SocialAccountsCard />
              <CommunityCard />
              <EventsWidget />
              <TripSavingsCalculator />
              <RecentPostsCard className="lg:col-span-2 xl:col-span-3" />
            </div>
          </main>
        </div>
      </div>

      {/* Bottom nav (mobile only) */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* AI Concierge — floats on every dashboard page */}
      <ConciergeWidget memberName={user.name} memberTier={user.memberTier} />
    </div>
  );
}
