const perks = [
  {
    icon: "◈",
    title: "Private Community Platform",
    body: "A curated, invite-only space. No noise. Just operators who build at the same level as you.",
  },
  {
    icon: "◈",
    title: "Monthly Founder Sessions",
    body: "Deep-dive strategy sessions, guest speakers, and deal rooms — exclusively for Monetura founders.",
  },
  {
    icon: "◈",
    title: "Curated Introductions",
    body: "We make warm introductions to founders, operators, and partners inside the network when the fit is right.",
  },
  {
    icon: "◈",
    title: "The Monetura Platform",
    body: "Tools, resources, and software built for founders. $199/month post-launch — included in your founder tier.",
  },
  {
    icon: "◈",
    title: "In-Person Events",
    body: "Annual retreats and quarterly gatherings across Canada. The conversations that happen in person can't be replicated online.",
  },
  {
    icon: "◈",
    title: "Lifetime Access",
    body: "One payment. No subscriptions for community access. As Monetura grows, your access only expands.",
  },
];

export default function OfferSection() {
  return (
    <section className="bg-monetura-cream py-32 lg:py-40">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section label */}
        <p className="text-monetura-sunset text-xs tracking-[0.3em] uppercase font-garet mb-12">
          The Offer
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-end mb-20">
          <h2 className="font-garet font-bold text-3xl md:text-4xl lg:text-5xl text-monetura-charcoal leading-[1.15]">
            Everything you need
            <br />
            to build with people
            <br />
            <span className="text-monetura-terracotta">worth building with.</span>
          </h2>
          <p className="text-monetura-earth text-base md:text-lg leading-relaxed">
            Founder access isn&rsquo;t just a purchase — it&rsquo;s a commitment
            to the community. In return, you get access to everything we build,
            for life.
          </p>
        </div>

        {/* Perks grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-monetura-sand">
          {perks.map(({ icon, title, body }) => (
            <div
              key={title}
              className="bg-monetura-cream p-10 hover:bg-white transition-colors duration-300"
            >
              <p className="text-monetura-champagne text-xl mb-5">{icon}</p>
              <h3 className="font-garet font-bold text-base text-monetura-charcoal mb-3 leading-snug">
                {title}
              </h3>
              <p className="text-monetura-earth text-sm leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
