import type { CharacterAppearance, IconName } from "../types";

const PATHS: Record<IconName, React.ReactNode> = {
  palm: <path d="M12 21c0-5 .5-8 2-11M14 10c-2-3-5-3.5-8-2 2.5-.1 4.5.6 6 2.2M14 10c.2-3-1.4-5.3-4.4-6.3 2 1.3 3.2 3.2 3.4 5.3M14 10c1.7-2.5 4.5-3 7.4-1.5-2.4 0-4.5.4-6.1 1.8M14 10c2.5-.5 4.8.7 6 3.5-1.5-1.7-3.5-2.8-5.5-3M14 10c-2.4-.4-4.8.7-6 3.5 1.5-1.8 3.4-2.7 5.5-3" />,
  play: <><circle cx="12" cy="12" r="9" /><path d="M10 8.2 16 12l-6 3.8z" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></>,
  handshake: <path d="m3 9 4-3 4 2 2-1 4-1 4 3M3 9v6l3 2M21 9v6l-3 2M11 8l-3 3c-.7.9.5 2.2 1.5 1.6l2.5-1.6 5.5 4.5c.8 1-.6 2.3-1.6 1.6L14 14m1.5 5.4c-.5 1-2 .8-2.5 0L11.5 18m-1.3.7c-.7.7-2 .3-2.2-.7L6 17" />,
  pen: <path d="m4 20 1-4L16 5l3 3L8 19l-4 1zM14 7l3 3" />,
  calendar: <><rect x="4" y="5.5" width="16" height="14.5" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M8 13.5h2M14 13.5h2M8 16.5h2" /></>,
  chart: <path d="M5 20v-5M10.3 20v-9M15.6 20v-13M21 20H3M20 20V10" />,
  people: <><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c.4-4 3-6 6.5-6s6.1 2 6.5 6" /><circle cx="19" cy="9.5" r="2" /><circle cx="5" cy="9.5" r="2" /></>,
  bag: <><path d="M5.5 8h13l1 12.5h-15z" /><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 4 6 4 9s-1 6-4 9c-3-3-4-6-4-9s1-6 4-9z" /></>,
  coins: <><ellipse cx="9" cy="7.5" rx="6" ry="2.8" /><path d="M3 7.5v4.2c0 1.5 2.7 2.8 6 2.8M15 7.5V10" /><ellipse cx="15" cy="14" rx="6" ry="2.8" /><path d="M9 14v3.7c0 1.5 2.7 2.8 6 2.8s6-1.3 6-2.8V14" /></>,
  cog: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></>,
  scale: <path d="M12 4v16M7.5 20h9M5 7h14M5 7l-2.5 6.5a3 3 0 0 0 5 0zM19 7l-2.5 6.5a3 3 0 0 0 5 0z" />,
  plug: <path d="M9 3v5M15 3v5M6.5 8h11v3.5a5.5 5.5 0 0 1-11 0zM12 17v4" />,
  pie: <><path d="M12 3a9 9 0 1 0 9 9h-9z" /><path d="M15.5 3.5a8 8 0 0 1 5 5h-5z" /></>,
  m: <path d="M3.5 19V5.5L12 15l8.5-9.5V19" strokeWidth="2.4" />,
  bell: <path d="M6 16.5c1-1.5 1-3.4 1-5.5a5 5 0 0 1 10 0c0 2.1 0 4 1 5.5zM10 19.5a2.2 2.2 0 0 0 4 0" />,
  lock: <><rect x="5.5" y="10.5" width="13" height="9.5" rx="2" /><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" /></>,
  film: <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 5v14M16 5v14M4 9.5h4M16 9.5h4M4 14.5h4M16 14.5h4" /></>,
  image: <><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m5 17 4.5-4 3 2.5 3-3.5 3.5 4" /></>,
  doc: <><path d="M7 3.5h7.5L18 7v13.5H7z" /><path d="M10 11h5M10 14h5M10 17h3" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12.2 2.7 2.7L16.2 9.5" /></>,
  megaphone: <path d="M4 10v4l3 .5 11 4V5.5l-11 4zM7 14.5 8.5 20h2.5l-1-4.5M18 9.5c1.5 0 2.5 1 2.5 2.5s-1 2.5-2.5 2.5" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  pause: <path d="M9 5.5v13M15 5.5v13" strokeWidth="2.4" />,
  next: <path d="m7 5.5 9 6.5-9 6.5zM18 5.5v13" />,
  prev: <path d="m17 5.5-9 6.5 9 6.5zM6 5.5v13" />,
  team: <><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19.5c.4-3.5 2.6-5.5 5.5-5.5s5.1 2 5.5 5.5M16 6a3 3 0 0 1 0 5.5M17.5 14.4c1.8.7 3 2.5 3.2 5" /></>,
  projects: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 9.5h16M9 3.5V7M15 3.5V7M8 13.5h8M8 16.5h5" /></>,
  island: <><path d="M3 18c2 1.4 4 1.4 6 0s4-1.4 6 0 4 1.4 6 0" /><path d="M5.5 14.5C7 11 9.5 9.5 12 9.5s5 1.5 6.5 5" /><path d="M12 9.5V4.5l3.5 2" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.2" /><rect x="13" y="4" width="7" height="7" rx="1.2" /><rect x="4" y="13" width="7" height="7" rx="1.2" /><rect x="13" y="13" width="7" height="7" rx="1.2" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5v.2" /></>,
  settings: <path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h7M15 17h5M14 5v4M6 10v4M11 15v4" />,
};

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

/** Monetura's M mark, in gold. */
export function MMark({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="hq-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2d58f" />
          <stop offset="0.55" stopColor="#d4a853" />
          <stop offset="1" stopColor="#a87a2e" />
        </linearGradient>
      </defs>
      <path d="M4 34V6.5h4.6L20 20.5 31.4 6.5H36V34h-6V17.6l-9.2 11.2h-1.6L10 17.6V34z" fill="url(#hq-gold)" />
    </svg>
  );
}

/** Small portrait built from the same appearance config as the 3D figure. */
export function Avatar({ look, size = 38 }: { look: CharacterAppearance; size?: number }) {
  const long = look.hairStyle === "long" || look.hairStyle === "curly";
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} role="presentation" className="rounded-full flex-none" style={{ background: "#4a3728" }}>
      {long ? <ellipse cx="20" cy="21" rx="11.5" ry="13" fill={look.hair} /> : null}
      <path d="M6 40c.8-8 6.5-12 14-12s13.2 4 14 12z" fill={look.top} />
      <rect x="17" y="23" width="6" height="7" rx="2.5" fill={look.skin} />
      <ellipse cx="20" cy="18" rx="7.6" ry="8.8" fill={look.skin} />
      {look.hairStyle === "bald" ? null : <path d="M12 17.5C11 9.5 15.5 7 20 7s9 2.5 8 10.5c-1-3.5-3.5-5.5-8-5.5s-7 2-8 5.5z" fill={look.hair} />}
      {look.hairStyle === "bun" ? <circle cx="20" cy="6" r="3.2" fill={look.hair} /> : null}
      <circle cx="17" cy="18.5" r="0.9" fill="#1a120c" />
      <circle cx="23" cy="18.5" r="0.9" fill="#1a120c" />
      <path d="M17.6 22.4c1.5 1 3.3 1 4.8 0" stroke="#7b4a3b" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {look.headphones ? <path d="M11.5 18c0-7 3.5-10.8 8.5-10.8S28.500 11 28.500 18" stroke="#1b1b1d" strokeWidth="1.4" fill="none" /> : null}
    </svg>
  );
}
