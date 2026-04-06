const features = [
  {
    icon: "◈",
    title: "AI Content Creation",
    body: "Upload photos from any experience. Write one sentence of context. Monetura's AI generates a full blog post, Instagram caption, LinkedIn post, TikTok caption, and 10 hashtags — automatically.",
  },
  {
    icon: "◈",
    title: "Social Publishing",
    body: "Your content publishes to all your social platforms simultaneously. Instagram, Facebook, LinkedIn, TikTok — with your affiliate link embedded in every post.",
  },
  {
    icon: "◈",
    title: "Affiliate Income",
    body: "Every post includes your unique tracking link. When someone signs up through your content, you earn commissions. 3 active referrals and your membership pays for itself.",
  },
  {
    icon: "◈",
    title: "Member Travel Rates",
    body: "Access exclusive member-only travel rates through our Arrivia partnership. Book hotels, flights, and experiences at rates the public can't access.",
  },
];

export default function PlatformSection() {
  return (
    <section className="bg-monetura-charcoal py-32 lg:py-40 border-t border-monetura-sand/10">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section label */}
        <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-12">
          The Platform
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end mb-20">
          <h2 className="font-garet font-bold text-3xl md:text-4xl lg:text-5xl text-monetura-cream leading-[1.15]">
            The platform that turns
            <br />
            your life into{" "}
            <span className="text-monetura-champagne">income.</span>
          </h2>
          <p className="text-monetura-cream/50 text-base md:text-lg leading-relaxed">
            Every experience you have — travel, dining, adventure — becomes
            content that earns. Monetura&rsquo;s AI does the heavy lifting.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-monetura-sand/10">
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
