"use client";

import { CalendarDaysIcon, ArrowRightIcon } from "./icons";

type EventType = "Member Meetup" | "Curated Experience" | "Travel Experience" | "Adventure";

interface Event {
  title: string;
  date: string;
  type: EventType;
  location: string;
  description?: string;
}

const EVENTS: Event[] = [
  {
    title: "Founders Meetup — Calgary",
    date: "May 15",
    type: "Member Meetup",
    location: "Calgary, AB",
  },
  {
    title: "Wellness & Growth Retreat",
    date: "May 28",
    type: "Curated Experience",
    location: "Tulum, Mexico",
    description: "Coaching and business development in paradise",
  },
  {
    title: "Santorini Curated Experience",
    date: "June 8",
    type: "Travel Experience",
    location: "Santorini, Greece",
  },
  {
    title: "Safari Photography Adventure",
    date: "June 22",
    type: "Adventure",
    location: "Botswana, Africa",
    description: "Learn how to capture stunning nature shots on safari",
  },
  {
    title: "Banff Weekend Retreat",
    date: "July 12",
    type: "Member Meetup",
    location: "Banff, AB",
  },
];

const TYPE_COLORS: Record<EventType, string> = {
  "Member Meetup": "#FBF5ED",
  "Curated Experience": "#7BAE8A",
  "Travel Experience": "#D4A853",
  "Adventure": "#C4704F",
};

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
        style={{ background: "linear-gradient(90deg, #C17A4A 0%, #D4A853 40%, transparent 100%)" }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#C4A882" }}>
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
            <div key={event.title}>
              <div className="flex items-start gap-3 py-4">
                {/* Type dot */}
                <span
                  className="mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: TYPE_COLORS[event.type] }}
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
                      {event.date}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: "#8B6E52" }}>
                    {event.location}
                  </p>
                  {event.description && (
                    <p className="text-sm mt-0.5 italic" style={{ color: "#6B5442" }}>
                      {event.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Divider — not after last item */}
              {i < EVENTS.length - 1 && (
                <div className="h-px" style={{ background: "#3D2E26" }} />
              )}
            </div>
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
