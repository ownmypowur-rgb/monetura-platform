"use client";

interface StatCard {
  label: string;
  value: string;
  sub: string;
  positive: boolean;
  icon: string;
}

interface StatsBarProps {
  creditsRemaining?: number;
  creditsTotal?: number;
}

export function StatsBar({ creditsRemaining, creditsTotal }: StatsBarProps) {
  const creditsValue = creditsRemaining !== undefined ? String(creditsRemaining) : "—";
  const creditsSub =
    creditsTotal !== undefined && creditsRemaining !== undefined
      ? `of ${creditsTotal} remaining`
      : "this month";

  const STATS: StatCard[] = [
    {
      label: "Total Reach",
      value: "24,847",
      sub: "+12% this month",
      positive: true,
      icon: "👁",
    },
    {
      label: "Commissions",
      value: "$1,240",
      sub: "CAD this month",
      positive: true,
      icon: "◈",
    },
    {
      label: "Posts",
      value: "8",
      sub: "published this month",
      positive: true,
      icon: "✦",
    },
    {
      label: "AI Credits",
      value: creditsValue,
      sub: creditsSub,
      positive: false,
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
              <div
                className="flex items-center gap-1 text-xs"
                style={{ color: stat.positive ? "#7DAF7D" : "#C4A882" }}
              >
                {stat.positive && stat.sub.startsWith("+") && (
                  <span>↑</span>
                )}
                <span>{stat.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
