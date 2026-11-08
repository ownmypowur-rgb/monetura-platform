const benefits = [
  {
    category: "Community",
    items: [
      "A small, chosen community of people who left too",
      "Challenges, events and trips with people who get it",
      "A direct line into what we build next",
    ],
  },
  {
    category: "Trips",
    items: [
      "Founder retreats, small by design, in places like Puerto Vallarta (booked separately)",
      "Plan your next trip together, between trips",
      "Optional member travel rates through our Arrivia partnership",
    ],
  },
  {
    category: "Your story",
    items: [
      "Upload photos from any experience",
      "AI shapes them into captions, posts and blog stories for your own pages",
      "Your referral link in every post",
    ],
  },
  {
    category: "Five pillars",
    items: ["Mind, Body, Kindness, Growth, Love", "Shaping the retreats and the everyday platform"],
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
          What founders get.
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
