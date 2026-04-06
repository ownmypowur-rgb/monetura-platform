const perks = [
  {
    icon: "◈",
    title: "Lifetime Community Access",
    body: "Pay once. Access forever. No subscription for community membership. As Monetura grows, your access only expands — never shrinks.",
  },
  {
    icon: "◈",
    title: "No Price Increases. Ever.",
    body: "Founders lock in at their founding price permanently. When membership costs more in the future, you've already paid. That's the deal.",
  },
  {
    icon: "◈",
    title: "Platform Software Included",
    body: "Your founder access includes the Monetura platform — AI content tools, social publishing, affiliate tracking. All of it, for life.",
  },
  {
    icon: "◈",
    title: "Monthly Founder Sessions",
    body: "Deep-dive strategy sessions, guest speakers, and community conversations — exclusively for Monetura founders. Every month.",
  },
  {
    icon: "◈",
    title: "You Shape What This Becomes",
    body: "Founding members have a direct line to the product roadmap. The features we build next are shaped by the people already inside.",
  },
  {
    icon: "◈",
    title: "Canada First",
    body: "Monetura is launching exclusively in Canada. We're building the most connected, most aligned travel creator network this country has ever had.",
  },
];

export default function OfferSection() {
  return (
    <section className="bg-monetura-cream py-32 lg:py-40">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section label */}
        <p className="text-monetura-sunset text-xs tracking-[0.3em] uppercase font-garet mb-12">
          Why Founders
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-end mb-20">
          <h2 className="font-garet font-bold text-3xl md:text-4xl lg:text-5xl text-monetura-charcoal leading-[1.15]">
            Be part of the
            <br />
            founding chapter.
            <br />
            <span className="text-monetura-terracotta">The terms never get better.</span>
          </h2>
          <p className="text-monetura-earth text-base md:text-lg leading-relaxed">
            Monetura is launching with a limited Founders Club — the first 200
            members who shape what this platform becomes. One payment. Lifetime
            access. No price increases. Ever.
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
