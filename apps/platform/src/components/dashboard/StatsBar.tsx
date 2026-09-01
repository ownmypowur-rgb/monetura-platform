"use client";

interface StatCard {
  label: string;
  value: string;
  sub: string;
  icon: string;
}

export interface DashboardStats {
  /** Sum of follower counts across connected accounts, or null when unknown. */
  totalReach: number | null;
  /** Commissions earned this month, in cents (CAD). */
  commissionsCents: number;
  /** Posts published this calendar month. */
  postsThisMonth: number;
}

interface StatsBarProps {
  creditsRemaining?: number;
  creditsTotal?: number;
  stats: DashboardStats;
}

function formatCad(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-CA")}`;
}

export function StatsBar({ creditsRemaining, creditsTotal, stats }: StatsBarProps) {
  const creditsValue = creditsRemaining !== undefined ? String(creditsRemaining) : "—";
  const creditsSub =
    creditsTotal !== undefined && creditsRemaining !== undefined
      ? `of ${creditsTotal} remaining`
      : "this month";

  const STATS: StatCard[] = [
    {
      label: "Total Reach",
      value:
        stats.totalReach !== null
          ? stats.totalReach.toLocaleString("en-CA")
          : "—",
      sub:
        stats.totalReach !== null
          ? "across connected accounts"
          : "connect accounts to track",
      icon: "👁",
    },
    {
      label: "Commissions",
      value: formatCad(stats.commissionsCents),
      sub: "CAD this month",
      icon: "◈",
    },
    {
      label: "Posts",
      value: String(stats.postsThisMonth),
      sub: "published this month",
      icon: "✦",
    },
    {
      label: "AI Credits",
      value: creditsValue,
      sub: creditsSub,
      icon: "⬡",
    },
  ];

  return (
    <section className="px-4 lg:px-8 mt-2">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4 flex flex-col justify-between"
            style={{
              background: "#2C2420",
              border: "1px solid #4A3728",
              boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
              minHeight: "110px",
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm tracking-[0.12em] uppercase" style={{ color: "#C4A882" }}>
                {stat.label}
              </span>
              <span className="text-base" style={{ color: "#8B6E52" }}>
                {stat.icon}
              </span>
            </div>

            <div>
              <div
                className="text-4xl font-light leading-none mb-1.5"
                style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
              >
                {stat.value}
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: "#C4A882" }}>
                <span>{stat.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
