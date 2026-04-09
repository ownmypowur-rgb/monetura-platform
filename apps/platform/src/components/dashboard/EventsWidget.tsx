"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDaysIcon, ArrowRightIcon } from "./icons";
import { EVENTS, type EventType } from "@/lib/events-data";

// ---------------------------------------------------------------------------
// EventRow — hover state per row
// ---------------------------------------------------------------------------

function EventRow({
  event,
  isLast,
}: {
  event: EventType;
  isLast: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  // Short date: "May 15, 2026" → "May 15"
  const shortDate = event.date.split(",")[0] ?? event.date;

  return (
    <div>
      <Link
        href={`/events/${event.slug}`}
        style={{ display: "block", textDecoration: "none" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="flex items-start gap-3 py-4 rounded-lg transition-all"
          style={{
            // always reserve 2px left border width to prevent layout shift
            borderLeft: `2px solid ${hovered ? "#D4A853" : "transparent"}`,
            background: hovered ? "rgba(212,168,83,0.04)" : "transparent",
            paddingLeft: "0.5rem",
            transition: "background 0.15s, border-color 0.15s",
          }}
        >
          {/* Type dot */}
          <span
            className="mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: event.typeDot }}
          />

          {/* Event info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-base font-semibold leading-snug"
                style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
              >
                {event.title}
              </p>
              <span
                className="text-sm font-semibold whitespace-nowrap flex-shrink-0"
                style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
              >
                {shortDate}
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: "#8B6E52" }}>
              {event.location}
            </p>
            {"description" in event && typeof event.description === "string" && (
              <p className="text-sm mt-0.5 italic line-clamp-1" style={{ color: "#6B5442" }}>
                {event.tagline}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Divider — not after last item */}
      {!isLast && <div className="h-px" style={{ background: "#3D2E26" }} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EventsWidget
// ---------------------------------------------------------------------------

export function EventsWidget() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#2C2420",
        border: "1px solid #4A3728",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* Accent bar */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, #C17A4A 0%, #D4A853 40%, transparent 100%)",
        }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <p
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: "#C4A882" }}
          >
            Upcoming Events
          </p>
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
            style={{
              background: "rgba(212,168,83,0.08)",
              border: "1px solid rgba(212,168,83,0.2)",
            }}
          >
            <CalendarDaysIcon size={20} style={{ color: "#D4A853" }} />
          </div>
        </div>

        {/* Event list */}
        <div className="mb-5">
          {EVENTS.map((event, i) => (
            <EventRow
              key={event.slug}
              event={event}
              isLast={i === EVENTS.length - 1}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-base font-medium tracking-[0.08em] transition-all active:scale-[0.98]"
          style={{
            background: "transparent",
            border: "1px solid #D4A853",
            color: "#D4A853",
            fontFamily: "var(--font-heading)",
          }}
        >
          View All Events
          <ArrowRightIcon size={14} />
        </button>
      </div>
    </div>
  );
}
