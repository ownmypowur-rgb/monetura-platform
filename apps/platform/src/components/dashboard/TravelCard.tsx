"use client";

import { GlobeIcon, ArrowRightIcon } from "./icons";

export function TravelCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#2C2420",
        border: "1px solid #3D2E26",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* Gradient header band */}
      <div
        className="px-5 pt-5 pb-4"
        style={{
          background:
            "linear-gradient(135deg, #1A0F0A 0%, #2C1A0E 50%, #2C2420 100%)",
          borderBottom: "1px solid #3D2E26",
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p
              className="text-xs tracking-[0.15em] uppercase mb-1.5"
              style={{ color: "#8B6E52" }}
            >
              Member Benefit
            </p>
            <h2
              className="text-xl font-light"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              Member Travel Rates
            </h2>
          </div>
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
            style={{ background: "rgba(212,168,83,0.08)", border: "1px solid rgba(212,168,83,0.2)" }}
          >
            <GlobeIcon size={20} style={{ color: "#D4A853" }} />
          </div>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: "#8B6E52" }}>
          Exclusive rates on flights, hotels and experiences through your Arrivia membership.
        </p>
      </div>

      <div className="p-5">
        {/* Stat pills */}
        <div className="flex gap-2.5 mb-5">
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(212,168,83,0.08)",
              border: "1px solid rgba(212,168,83,0.2)",
              color: "#D4A853",
            }}
          >
            <span>✦</span> Up to 60% off hotels
          </span>
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(193,122,74,0.08)",
              border: "1px solid rgba(193,122,74,0.2)",
              color: "#C17A4A",
            }}
          >
            <span>◈</span> Member-only pricing
          </span>
        </div>

        {/* Destination previews */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { city: "Santorini", discount: "52%" },
            { city: "Kyoto", discount: "45%" },
            { city: "Maldives", discount: "38%" },
          ].map((dest) => (
            <div
              key={dest.city}
              className="rounded-xl p-2.5 text-center"
              style={{ background: "#1A0F0A", border: "1px solid #3D2E26" }}
            >
              <div
                className="text-sm font-semibold"
                style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
              >
                {dest.discount}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "#8B6E52" }}>
                {dest.city}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium tracking-[0.08em] transition-all active:scale-[0.98]"
          style={{
            background: "transparent",
            border: "1px solid #D4A853",
            color: "#D4A853",
            fontFamily: "var(--font-heading)",
          }}
        >
          Browse Travel Deals
          <ArrowRightIcon size={14} />
        </button>
      </div>
    </div>
  );
}
