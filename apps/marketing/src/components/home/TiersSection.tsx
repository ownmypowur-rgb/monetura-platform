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
      "Everything in Explorer, plus priority introductions and access to in-person events across Canada.",
    features: [
      "Everything in Explorer",
      "Priority curated introductions",
      "In-person event access",
      "City meetup priority seating",
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
      "Annual Canadian founder retreat",
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
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section label */}
        <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-12">
          The Founders Club
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end mb-20">
          <h2 className="font-garet font-bold text-3xl md:text-4xl lg:text-5xl text-monetura-cream leading-[1.15]">
            Be part of the
            <br />
            founding chapter.
            <br />
            <span className="text-monetura-champagne">One payment. Lifetime access.</span>
          </h2>
          <div className="space-y-4">
            <p className="text-monetura-cream/50 text-base md:text-lg leading-relaxed">
              This is not a course. This is not a mastermind. This is a
              platform, a business model, and a community — built around the
              life you already want to live.
            </p>
            <p className="text-monetura-cream/30 text-sm leading-relaxed">
              All tiers paid once via e-transfer or wire to ATB Bank. We review
              every application personally.
            </p>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-monetura-sand/10">
          {tiers.map(
            ({ name, price, currency, tagline, description, features, highlight, cta }) => (
              <div
                key={name}
                className={`relative p-8 lg:p-10 flex flex-col ${
                  highlight
                    ? "bg-monetura-mocha border border-monetura-champagne/30"
                    : "bg-monetura-charcoal border border-monetura-sand/10"
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-monetura-champagne text-monetura-charcoal text-[10px] tracking-[0.2em] uppercase font-garet font-bold px-4 py-1.5 whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-3">
                    {tagline}
                  </p>
                  <h3 className="font-garet font-bold text-xl text-monetura-cream mb-4">
                    {name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-garet font-bold text-3xl text-monetura-cream">
                      {price}
                    </span>
                    <span className="text-monetura-cream/40 text-sm">
                      {currency}
                    </span>
                  </div>
                  <p className="text-monetura-cream/40 text-xs tracking-[0.1em] uppercase">
                    One-time payment
                  </p>
                </div>

                <p className="text-monetura-cream/50 text-sm leading-relaxed mb-6">
                  {description}
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-monetura-cream/70"
                    >
                      <span className="text-monetura-champagne mt-0.5 text-xs flex-shrink-0">
                        ✦
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href="/founders/apply"
                  className={`text-center text-xs tracking-[0.15em] uppercase py-4 px-4 border transition-all duration-300 font-garet ${
                    highlight
                      ? "border-monetura-champagne bg-monetura-champagne text-monetura-charcoal hover:bg-transparent hover:text-monetura-champagne"
                      : "border-monetura-cream/20 text-monetura-cream/70 hover:border-monetura-champagne hover:text-monetura-champagne"
                  }`}
                >
                  {cta}
                </a>
              </div>
            ),
          )}
        </div>

        <p className="text-center text-monetura-cream/25 text-xs tracking-wide mt-8">
          Payment via e-transfer or wire — ATB Bank. Not processed through
          Stripe. We review every application personally.
        </p>
      </div>
    </section>
  );
}
