const features = [
  {
    icon: "◈",
    title: "AI Content Engine",
    body: "Upload photos from any experience. Monetura's AI generates professional content for every platform — blog, Instagram, Facebook, LinkedIn, TikTok — in your voice, in seconds.",
  },
  {
    icon: "◈",
    title: "Member Travel Rates",
    body: "Optional member rates on hotels, flights, cruises and experiences through our Arrivia partnership. A nice extra for flexible travellers.",
  },
  {
    icon: "◈",
    title: "Your Referral Link",
    body: "Every piece of content you publish includes your unique tracking link. Share what you love with your people.",
  },
  {
    icon: "◈",
    title: "Private Community",
    body: "A small, chosen community of people who left too. Real people. Real conversations. No noise.",
  },
  {
    icon: "◈",
    title: "Social Publishing Hub",
    body: "Share your story to your own pages in a few clicks, shaped for each platform you use.",
  },
];

export default function PlatformSection() {
  return (
    <section className="bg-monetura-charcoal py-32 lg:py-40 border-t border-monetura-sand/10">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section label */}
        <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-12">
          What You Get
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end mb-20">
          <h2 className="font-garet font-bold text-3xl md:text-4xl lg:text-5xl text-monetura-cream leading-[1.15]">
            Everything you need to turn
            <br />
            passion into{" "}
            <span className="text-monetura-champagne">a platform.</span>
          </h2>
          <p className="text-monetura-cream/50 text-base md:text-lg leading-relaxed">
            One membership. Every feature is built around the same
            idea — your experiences already have value. Monetura helps you
            capture it.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-monetura-sand/10">
          {features.map(({ icon, title, body }) => (
            <div
              key={title}
              className="bg-monetura-charcoal border border-monetura-sand/10 p-10 hover:border-monetura-champagne/20 transition-colors duration-300"
            >
              <p className="text-monetura-champagne text-xl mb-5">{icon}</p>
              <h3 className="font-garet font-bold text-base text-monetura-cream mb-3 leading-snug">
                {title}
              </h3>
              <p className="text-monetura-cream/50 text-sm leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
