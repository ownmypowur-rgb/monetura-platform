const features = [
  {
    icon: "◈",
    title: "AI Content Engine",
    body: "Upload photos from any experience. Monetura's AI generates professional content for every platform — blog, Instagram, Facebook, LinkedIn, TikTok — in your voice, in seconds.",
  },
  {
    icon: "◈",
    title: "Member Travel Rates",
    body: "Access exclusive rates on hotels, flights, cruises, and experiences through our Arrivia partnership. Travel more for less — and create more content while you do it.",
  },
  {
    icon: "◈",
    title: "Affiliate Income System",
    body: "Every piece of content you publish includes your unique tracking link. Build an audience. Earn commissions. Three referrals and your monthly membership is free.",
  },
  {
    icon: "◈",
    title: "Private Community",
    body: "Connect with a curated community of lifestyle creators and travellers who are building the same thing you are. Real people. Real conversations. No noise.",
  },
  {
    icon: "◈",
    title: "Social Publishing Hub",
    body: "One click publishes your content to all platforms simultaneously. Your posts go to your audience AND to the Monetura brand channels — doubling your reach automatically.",
  },
  {
    icon: "◈",
    title: "Monthly Performance Reports",
    body: "See exactly how your content is performing — reach, clicks, commissions earned, and top posts. Know what's working and do more of it.",
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
            Six tools, one membership. Every feature is built around the same
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
