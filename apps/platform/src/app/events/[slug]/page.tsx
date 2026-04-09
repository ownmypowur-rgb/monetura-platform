import { notFound } from "next/navigation";
import Link from "next/link";
import { EVENTS } from "@/lib/events-data";

export default function EventDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const event = EVENTS.find((e) => e.slug === params.slug);
  if (!event) notFound();

  const paragraphs = event.description.split("\n\n");

  return (
    <div style={{ background: "#2C2420", minHeight: "100vh" }}>

      {/* ── Section 1: Cinematic Hero ──────────────────────────── */}
      <div className="relative h-[60vh] overflow-hidden">
        {/* Hero image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.heroImage}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark gradient overlay — bottom-heavy */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 45%, transparent 100%)",
          }}
        />

        {/* Back arrow — top left */}
        <div className="absolute top-5 left-5 z-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
            style={{
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
              color: "#E8DCCB",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15,18 9,12 15,6" />
            </svg>
            Dashboard
          </Link>
        </div>

        {/* Hero content — bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 md:px-12 md:pb-10">
          {/* Type badge */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: event.typeDot }}
            />
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: "#C4A882" }}
            >
              {event.type}
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-4xl md:text-5xl font-semibold leading-tight mb-2"
            style={{ color: "#FFFFFF", fontFamily: "var(--font-heading)" }}
          >
            {event.title}
          </h1>

          {/* Tagline */}
          <p
            className="text-lg italic"
            style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
          >
            {event.tagline}
          </p>
        </div>
      </div>

      {/* ── Section 2: Details Bar ─────────────────────────────── */}
      <div
        style={{
          background: "#1A0F0A",
          borderTop: "1px solid #4A3728",
          borderBottom: "1px solid #4A3728",
        }}
      >
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-3 divide-x" style={{ borderColor: "#4A3728" }}>
            {/* Date & Duration */}
            <div className="py-5 pr-6">
              <p
                className="text-xs font-bold tracking-widest uppercase mb-1.5"
                style={{ color: "#8B6E52" }}
              >
                Date & Duration
              </p>
              <p
                className="text-base font-semibold"
                style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
              >
                {event.date}
              </p>
              <p className="text-sm mt-0.5" style={{ color: "#C4A882" }}>
                {event.duration}
              </p>
            </div>

            {/* Location */}
            <div className="py-5 px-6">
              <p
                className="text-xs font-bold tracking-widest uppercase mb-1.5"
                style={{ color: "#8B6E52" }}
              >
                Location
              </p>
              <p
                className="text-base font-semibold"
                style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
              >
                {event.location}
              </p>
              <p className="text-sm mt-0.5" style={{ color: "#C4A882" }}>
                {event.country}
              </p>
            </div>

            {/* Price */}
            <div className="py-5 pl-6">
              <p
                className="text-xs font-bold tracking-widest uppercase mb-1.5"
                style={{ color: "#8B6E52" }}
              >
                Investment
              </p>
              <p
                className="text-base font-semibold"
                style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
              >
                {event.price}
              </p>
              <p className="text-sm mt-0.5" style={{ color: "#C4A882" }}>
                {event.priceNote}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Description ─────────────────────────────── */}
      <div className="py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <p
            className="text-xs font-bold tracking-widest uppercase mb-6"
            style={{ color: "#8B6E52" }}
          >
            About this event
          </p>
          <div className="space-y-5">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-base leading-relaxed"
                style={{ color: "#FBF5ED" }}
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 4: What's Included ─────────────────────────── */}
      <div
        className="py-12 md:py-16 px-6 md:px-12"
        style={{ background: "#1A0F0A", borderTop: "1px solid #3D2E26" }}
      >
        <div className="max-w-3xl mx-auto">
          <p
            className="text-xs font-bold tracking-widest uppercase mb-8"
            style={{ color: "#8B6E52" }}
          >
            What&apos;s included
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            {event.included.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex-shrink-0 text-base leading-none"
                  style={{ color: "#D4A853" }}
                >
                  ✦
                </span>
                <p
                  className="text-base"
                  style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 5: CTA ─────────────────────────────────────── */}
      <div className="py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm mb-6" style={{ color: "#8B6E52" }}>
            {event.priceNote}
          </p>

          <button
            className="w-full py-5 rounded-xl text-base font-semibold tracking-[0.1em] uppercase transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #C17A4A 0%, #D4A853 100%)",
              color: "#2C2420",
              boxShadow: "0 4px 24px rgba(193,122,74,0.3)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {event.ctaLabel}
          </button>

          <p className="text-sm mt-5" style={{ color: "#8B6E52" }}>
            Questions?{" "}
            <a
              href="mailto:founders@monetura.com"
              style={{ color: "#C4A882" }}
            >
              founders@monetura.com
            </a>
          </p>
        </div>
      </div>

    </div>
  );
}
