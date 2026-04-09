import Link from "next/link";
import { EVENTS } from "@/lib/events-data";

export default function EventsIndexPage() {
  return (
    <div style={{ background: "#1A0F0A", minHeight: "100vh" }}>
      <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="mb-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
            style={{ color: "#8B6E52", textDecoration: "none" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            Dashboard
          </Link>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#8B6E52" }}>
            Member Events
          </p>
          <h1
            className="text-4xl font-semibold"
            style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
          >
            Upcoming Events
          </h1>
          <p className="mt-2 text-base" style={{ color: "#C4A882" }}>
            Curated experiences, retreats, and meetups — exclusively for Monetura members.
          </p>
        </div>

        {/* ── Event cards ─────────────────────────────────────── */}
        <div className="space-y-5">
          {EVENTS.map((event) => (
            <Link
              key={event.slug}
              href={`/events/${event.slug}`}
              style={{ textDecoration: "none", display: "block" }}
            >
              <div
                className="group rounded-2xl overflow-hidden transition-all"
                style={{
                  background: "#2C2420",
                  border: "1px solid #4A3728",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
                }}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Hero image */}
                  <div className="relative sm:w-56 h-44 sm:h-auto flex-shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.heroImage}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to right, transparent 60%, rgba(44,36,32,0.8) 100%)",
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                    <div>
                      {/* Type badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: event.typeDot }}
                        />
                        <span
                          className="text-xs font-bold tracking-widest uppercase"
                          style={{ color: "#8B6E52" }}
                        >
                          {event.type}
                        </span>
                      </div>

                      {/* Title */}
                      <h2
                        className="text-xl font-semibold leading-snug mb-1 transition-colors group-hover:text-[#D4A853]"
                        style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
                      >
                        {event.title}
                      </h2>

                      {/* Tagline */}
                      <p
                        className="text-sm italic mb-3"
                        style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
                      >
                        {event.tagline}
                      </p>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: "#C4A882" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span
                          className="font-semibold"
                          style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
                        >
                          {event.date.split(",")[0]}
                        </span>
                        <span style={{ color: "#8B6E52" }}>· {event.duration}</span>
                      </span>

                      <span className="flex items-center gap-1.5 text-sm" style={{ color: "#8B6E52" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {event.location}
                      </span>

                      <span
                        className="ml-auto text-sm font-semibold"
                        style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
                      >
                        {event.price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
