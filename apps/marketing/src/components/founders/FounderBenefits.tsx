const benefits = [
  {
    category: "Community",
    items: [
      "Private, curated founder network",
      "Direct access to 199 other serious operators",
      "Member directory with warm intro protocol",
      "Private forum — no social media noise",
    ],
  },
  {
    category: "Platform",
    items: [
      "Monetura software platform (lifetime)",
      "Future tools built for founders",
      "Early access to every new feature",
      "Founder pricing on add-ons forever",
    ],
  },
  {
    category: "Events & Sessions",
    items: [
      "Monthly virtual strategy sessions",
      "Quarterly deep-dive workshops",
      "Annual Canadian founder retreat (Luminary)",
      "City-based meetups across Canada",
    ],
  },
  {
    category: "Network",
    items: [
      "Curated introductions by the Monetura team",
      "Deal flow and collaboration opportunities",
      "Guest speakers — operators not influencers",
      "Advisory seat opportunities (Luminary)",
    ],
  },
];

export default function FounderBenefits() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-12">
          What You Get
        </p>

        <h2 className="font-garet font-bold text-3xl md:text-4xl text-monetura-cream leading-[1.2] mb-16">
          Every benefit, in full.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-monetura-sand/10">
          {benefits.map(({ category, items }) => (
            <div
              key={category}
              className="bg-monetura-charcoal border border-monetura-sand/10 p-10"
            >
              <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-6">
                {category}
              </p>
              <ul className="space-y-4">
                {items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-monetura-cream/70"
                  >
                    <span className="text-monetura-champagne mt-0.5 text-xs flex-shrink-0">
                      ✦
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
