import {
  FOUNDER_TIERS,
  type FounderTierId,
} from "@monetura/config/src/tiers";

// Marketing copy stays local; names and taglines come from the
// canonical tier definition in @monetura/config.
const TIER_COPY: Record<
  FounderTierId,
  { description: string; features: string[]; highlight: boolean }
> = {
  explorer: {
    description:
      "Full platform access, AI tools, member travel rates, community access, and monthly sessions. Everything you need to start turning travel into income.",
    features: [
      "Full platform access (lifetime)",
      "AI content engine",
      "Member travel rates via Arrivia",
      "Private community access",
      "Monthly founder sessions",
    ],
    highlight: false,
  },
  trailblazer: {
    description:
      "Everything in Explorer, plus priority introductions and access to in-person events designed for deeper founder relationships.",
    features: [
      "Everything in Explorer",
      "Priority curated introductions",
      "In-person event access",
      "Priority seating at meetups",
      "Early access to new features",
    ],
    highlight: false,
  },
  pioneer: {
    description:
      "Everything in Trailblazer, plus quarterly strategy sessions and the earliest access to every new feature we ship.",
    features: [
      "Everything in Trailblazer",
      "Quarterly strategy sessions",
      "First access to every new feature",
      "Founder product input sessions",
      "Extended affiliate commission rate",
    ],
    highlight: true,
  },
  luminary: {
    description:
      "The complete Monetura experience. Annual retreat, 1:1 introductions, advisory opportunities, and the deepest level of founder relationships.",
    features: [
      "Everything in Pioneer",
      "Annual founder retreat",
      "1:1 founder introduction calls",
      "Advisory seat opportunities",
      "Founding member recognition",
    ],
    highlight: false,
  },
};

// Prices are intentionally absent: founder pricing is shared on the webinar,
// never on a public page. The canonical config keeps priceCad for internal use.
const tiers = FOUNDER_TIERS.map((t) => ({
  name: t.name,
  tagline: t.tagline,
  cta: `Apply as ${t.name}`,
  ...TIER_COPY[t.id],
}));

export default function TiersSection() {
  return (
    <section className="bg-monetura-charcoal py-20 sm:py-24 lg:py-40">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <p className="mb-8 text-xs uppercase tracking-[0.24em] text-monetura-champagne font-garet sm:mb-12 sm:tracking-[0.3em]">
          The Founders Club
        </p>

        <div className="mb-12 grid grid-cols-1 items-end gap-8 sm:mb-16 sm:gap-10 lg:mb-20 lg:grid-cols-2">
          <h2 className="font-garet text-3xl leading-[1.15] text-monetura-cream md:text-4xl lg:text-5xl">
            Be part of the
            <br />
            founding chapter.
            <br />
            <span className="text-monetura-champagne">
              One payment. Lifetime access.
            </span>
          </h2>
          <div className="space-y-4">
            <p className="text-base leading-relaxed text-monetura-cream/50 md:text-lg">
              This is not a course. This is not a mastermind. This is a
              platform, a business model, and a community — built around the
              life you already want to live.
            </p>
            <p className="text-sm leading-relaxed text-monetura-cream/30">
              All tiers paid once via e-transfer or wire to ATB Bank. Canada-
              first founder payments are being handled manually while every
              application is reviewed personally.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-px lg:bg-monetura-sand/10">
          {tiers.map(
            ({ name, tagline, description, features, highlight, cta }) => (
              <div
                key={name}
                  className={`relative flex flex-col rounded-[1.6rem] p-6 sm:p-8 lg:rounded-none lg:p-10 ${
                  highlight
                    ? "border border-monetura-champagne/30 bg-monetura-mocha"
                    : "border border-monetura-sand/10 bg-monetura-charcoal"
                }`}
              >
                {highlight && (
                  <div className="absolute left-6 top-5 sm:left-1/2 sm:-top-3 sm:-translate-x-1/2">
                    <span className="whitespace-nowrap rounded-full bg-monetura-champagne px-3 py-1 text-[9px] uppercase tracking-[0.16em] text-monetura-charcoal font-garet sm:px-4 sm:py-1.5 sm:text-[10px] sm:tracking-[0.2em]">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-5 pt-6 sm:mb-6 sm:pt-0">
                  <p className="mb-3 text-xs uppercase tracking-[0.3em] text-monetura-champagne font-garet">
                    {tagline}
                  </p>
                  <h3 className="mb-3 font-garet text-xl text-monetura-cream sm:mb-4">
                    {name}
                  </h3>
                  <p className="mb-2 font-garet text-xl text-monetura-cream/90">
                    One-time founding investment
                  </p>
                  <p className="text-xs uppercase tracking-[0.1em] text-monetura-cream/40">
                    Pricing shared on the webinar
                  </p>
                </div>

                <p className="mb-5 text-sm leading-relaxed text-monetura-cream/50 sm:mb-6">
                  {description}
                </p>

                <ul className="mb-6 flex-1 space-y-3 sm:mb-8">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-monetura-cream/70"
                    >
                      <span className="mt-0.5 flex-shrink-0 text-xs text-monetura-champagne">
                        ✦
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href="/founders/apply"
                  className={`min-h-[52px] px-4 py-4 text-center text-[10px] uppercase tracking-[0.12em] font-garet transition-all duration-300 sm:text-xs sm:tracking-[0.15em] ${
                    highlight
                      ? "border border-monetura-champagne bg-monetura-champagne text-monetura-charcoal hover:bg-transparent hover:text-monetura-champagne"
                      : "border border-monetura-cream/20 text-monetura-cream/70 hover:border-monetura-champagne hover:text-monetura-champagne"
                  }`}
                >
                  {cta}
                </a>
              </div>
            ),
          )}
        </div>

        <p className="mt-6 text-center text-[11px] leading-6 tracking-wide text-monetura-cream/25 sm:mt-8 sm:text-xs">
          Payment via e-transfer or wire — ATB Bank. Canada-first founder
          payments are currently handled manually while applications are
          reviewed personally.
        </p>
      </div>
    </section>
  );
}
