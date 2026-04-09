import Link from "next/link";

const PORTAL_URL = "https://members.monetura.com/";

const DESTINATIONS = [
  { city: "Santorini", region: "Greece", discount: "Up to 52% off" },
  { city: "Kyoto", region: "Japan", discount: "Up to 45% off" },
  { city: "Maldives", region: "Indian Ocean", discount: "Up to 38% off" },
] as const;

export default function TravelPage() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ background: "#1A0F0A" }}>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* ── Back link ─────────────────────────────────────────── */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm transition-colors"
          style={{ color: "#8B6E52" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Dashboard
        </Link>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div>
          <p className="text-xs tracking-[0.2em] uppercase mb-2" style={{ color: "#8B6E52" }}>
            Member Benefit
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light mb-3"
            style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
          >
            Member Travel Rates
          </h1>
          <p className="text-base leading-relaxed max-w-xl" style={{ color: "#C4A882" }}>
            Exclusive rates on flights, hotels and experiences — available only to Monetura members.
          </p>
        </div>

        {/* ── CTA card ────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "#2C2420", border: "1px solid #4A3728" }}
        >
          <div
            className="h-px w-full"
            style={{ background: "linear-gradient(90deg, #C17A4A 0%, #D4A853 60%, transparent 100%)" }}
          />
          <div className="p-8 flex flex-col items-center text-center">
            {/* Globe icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: "rgba(212,168,83,0.08)", border: "1px solid rgba(212,168,83,0.2)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>

            <h2
              className="text-2xl font-light mb-2"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              Your travel portal is ready
            </h2>
            <p className="text-sm mb-8 max-w-sm" style={{ color: "#8B6E52" }}>
              Access your exclusive member pricing on thousands of hotels, flights, cruises and vacation packages worldwide.
            </p>

            <a
              href={PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-semibold tracking-[0.08em] transition-all active:scale-[0.98]"
              style={{
                background: "#D4A853",
                color: "#2C2420",
                fontFamily: "var(--font-heading)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#C4973D"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#D4A853"; }}
            >
              Access Member Travel Portal
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15,3 21,3 21,9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>

            <p className="text-xs mt-4" style={{ color: "#8B6E52" }}>
              Powered by Arrivia — exclusive member pricing
            </p>
          </div>
        </div>

        {/* ── Destination highlights ──────────────────────────────── */}
        <div>
          <p className="text-xs tracking-[0.15em] uppercase mb-4" style={{ color: "#8B6E52" }}>
            Destination highlights
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DESTINATIONS.map((dest) => (
              <div
                key={dest.city}
                className="rounded-2xl p-5"
                style={{ background: "#2C2420", border: "1px solid #4A3728" }}
              >
                <p
                  className="text-2xl font-semibold mb-0.5"
                  style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
                >
                  {dest.discount}
                </p>
                <p className="text-base font-medium mb-0.5" style={{ color: "#FBF5ED" }}>
                  {dest.city}
                </p>
                <p className="text-xs" style={{ color: "#8B6E52" }}>
                  {dest.region}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Content upsell ──────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "#2C2420", border: "1px solid #4A3728" }}
        >
          <p className="text-xs tracking-[0.15em] uppercase mb-3" style={{ color: "#8B6E52" }}>
            Turn travel into income
          </p>
          <p className="text-base mb-4" style={{ color: "#E8DCCB" }}>
            Just booked a trip? Create content about your upcoming adventure and start earning before you leave.
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 text-base font-medium transition-colors"
            style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
          >
            Create a post about this trip
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </Link>
        </div>

      </div>
    </div>
  );
}
