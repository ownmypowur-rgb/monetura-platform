"use client";

import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { BottomNav } from "@/components/dashboard/BottomNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#130D0A" }}>
      <div className="lg:flex lg:h-screen">
        <SidebarNav activeTab="settings" onTabChange={() => {}} />
        <div className="flex-1 lg:overflow-y-auto pb-28 lg:pb-0">
          {children}
        </div>
      </div>
      <BottomNav activeTab="settings" onTabChange={() => {}} />
    </div>
  );
}
