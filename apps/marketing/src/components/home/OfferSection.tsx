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
    title: "Global Lifestyle Platform",
    body: "Monetura is built for travellers everywhere. Your content, your income, and your membership move with you wherever you go.",
  },
];

export default function OfferSection() {
  return (
    <section className="bg-monetura-cream py-32 lg:py-40">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <p className="mb-12 text-xs uppercase tracking-[0.3em] text-monetura-sunset font-garet">
          Why Founders
        </p>

        <div className="mb-20 grid grid-cols-1 items-end gap-16 lg:grid-cols-2">
          <h2 className="font-garet text-3xl leading-[1.15] text-monetura-charcoal md:text-4xl lg:text-5xl">
            Be part of the
            <br />
            founding chapter.
            <br />
            <span className="text-monetura-terracotta">
              The terms never get better.
            </span>
          </h2>
          <p className="text-base leading-relaxed text-monetura-earth md:text-lg">
            Monetura is launching with a limited Founders Club — the first 200
            members who shape what this platform becomes. One payment. Lifetime
            access. No price increases. Ever.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-monetura-sand sm:grid-cols-2 lg:grid-cols-3">
          {perks.map(({ icon, title, body }) => (
            <div
              key={title}
              className="bg-monetura-cream p-10 transition-colors duration-300 hover:bg-white"
            >
              <p className="mb-5 text-xl text-monetura-champagne">{icon}</p>
              <h3 className="mb-3 font-garet text-base leading-snug text-monetura-charcoal">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-monetura-earth">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
