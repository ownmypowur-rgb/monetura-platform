const tiers = [
  {
    name: "Explorer",
    price: "$2,500",
    currency: "CAD",
    tagline: "The foundation",
    description:
      "Full community access, platform software, and monthly sessions. Your entry into the Monetura network.",
    features: [
      "Lifetime community access",
      "Monetura platform (software)",
      "Monthly founder sessions",
      "Private member directory",
      "Digital resources library",
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
      "Quarterly strategy sessions",
      "Early access to new features",
    ],
    highlight: true,
    cta: "Apply as Trailblazer",
  },
  {
    name: "Luminary",
    price: "$5,500",
    currency: "CAD",
    tagline: "The pinnacle",
    description:
      "The full Monetura experience. VIP access, annual retreat, and direct founder relationships.",
    features: [
      "Everything in Trailblazer",
      "Annual retreat (all-inclusive)",
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
          Founder Tiers
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end mb-20">
          <h2 className="font-garet font-bold text-3xl md:text-4xl lg:text-5xl text-monetura-cream leading-[1.15]">
            One payment.
            <br />
            <span className="text-monetura-champagne">Lifetime access.</span>
          </h2>
          <p className="text-monetura-cream/50 text-base md:text-lg leading-relaxed">
            All tiers are paid once via e-transfer or wire to ATB Bank — not
            a subscription. We keep it simple. You keep your access forever.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-monetura-sand/10">
          {tiers.map(({ name, price, currency, tagline, description, features, highlight, cta }) => (
            <div
              key={name}
              className={`relative p-10 lg:p-12 flex flex-col ${
                highlight
                  ? "bg-monetura-mocha border border-monetura-champagne/30"
                  : "bg-monetura-charcoal border border-monetura-sand/10"
              }`}
            >
              {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-monetura-champagne text-monetura-charcoal text-[10px] tracking-[0.2em] uppercase font-garet font-bold px-4 py-1.5">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-3">
                  {tagline}
                </p>
                <h3 className="font-garet font-bold text-2xl text-monetura-cream mb-6">
                  {name}
                </h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="font-garet font-bold text-4xl text-monetura-cream">
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

              <p className="text-monetura-cream/50 text-sm leading-relaxed mb-8">
                {description}
              </p>

              <ul className="space-y-3 mb-10 flex-1">
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
                className={`text-center text-xs tracking-[0.15em] uppercase py-4 px-6 border transition-all duration-300 font-garet ${
                  highlight
                    ? "border-monetura-champagne bg-monetura-champagne text-monetura-charcoal hover:bg-transparent hover:text-monetura-champagne"
                    : "border-monetura-cream/20 text-monetura-cream/70 hover:border-monetura-champagne hover:text-monetura-champagne"
                }`}
              >
                {cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-monetura-cream/25 text-xs tracking-wide mt-8">
          Payment via e-transfer or wire — ATB Bank. Not processed through Stripe.
        </p>
      </div>
    </section>
  );
}
