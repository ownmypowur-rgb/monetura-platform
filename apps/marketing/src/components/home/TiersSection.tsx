const tiers = [
  {
    name: "Explorer",
    price: "$2,500",
    currency: "CAD",
    tagline: "The foundation",
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
    cta: "Apply as Explorer",
  },
  {
    name: "Trailblazer",
    price: "$3,500",
    currency: "CAD",
    tagline: "The inner circle",
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
    cta: "Apply as Trailblazer",
  },
  {
    name: "Pioneer",
    price: "$4,500",
    currency: "CAD",
    tagline: "The builder",
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
    cta: "Apply as Pioneer",
  },
  {
    name: "Luminary",
    price: "$5,500",
    currency: "CAD",
    tagline: "The pinnacle",
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
    cta: "Apply as Luminary",
  },
];

export default function TiersSection() {
  return (
    <section className="bg-monetura-charcoal py-32 lg:py-40">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <p className="mb-12 text-xs uppercase tracking-[0.3em] text-monetura-champagne font-garet">
          The Founders Club
        </p>

        <div className="mb-20 grid grid-cols-1 items-end gap-12 lg:grid-cols-2">
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

        <div className="grid grid-cols-1 gap-px bg-monetura-sand/10 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map(
            ({ name, price, currency, tagline, description, features, highlight, cta }) => (
              <div
                key={name}
                className={`relative flex flex-col p-8 lg:p-10 ${
                  highlight
                    ? "border border-monetura-champagne/30 bg-monetura-mocha"
                    : "border border-monetura-sand/10 bg-monetura-charcoal"
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="whitespace-nowrap bg-monetura-champagne px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-monetura-charcoal font-garet">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className="mb-3 text-xs uppercase tracking-[0.3em] text-monetura-champagne font-garet">
                    {tagline}
                  </p>
                  <h3 className="mb-4 font-garet text-xl text-monetura-cream">
                    {name}
                  </h3>
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="font-garet text-3xl text-monetura-cream">
                      {price}
                    </span>
                    <span className="text-sm text-monetura-cream/40">
                      {currency}
                    </span>
                  </div>
                  <p className="text-xs uppercase tracking-[0.1em] text-monetura-cream/40">
                    One-time payment
                  </p>
                </div>

                <p className="mb-6 text-sm leading-relaxed text-monetura-cream/50">
                  {description}
                </p>

                <ul className="mb-8 flex-1 space-y-3">
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
                  className={`px-4 py-4 text-center text-xs uppercase tracking-[0.15em] font-garet transition-all duration-300 ${
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

        <p className="mt-8 text-center text-xs tracking-wide text-monetura-cream/25">
          Payment via e-transfer or wire — ATB Bank. Canada-first founder
          payments are currently handled manually while applications are
          reviewed personally.
        </p>
      </div>
    </section>
  );
}
