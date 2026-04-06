const steps = [
  {
    number: "01",
    title: "Apply for founder access",
    body: "Complete a short application. We review every submission personally. This isn't a checkout page — it's a conversation.",
  },
  {
    number: "02",
    title: "Choose your founder tier",
    body: "Select Explorer, Trailblazer, or Luminary based on where you are and how deep you want to go. Each tier is lifetime access.",
  },
  {
    number: "03",
    title: "Join the inner circle",
    body: "Access the platform, the community, the events, and the network. Real relationships. Real conversations. Real access.",
  },
  {
    number: "04",
    title: "Grow with founders who get it",
    body: "Monthly sessions, curated introductions, and a private community of operators who are building at the same level as you.",
  },
];

export default function SolutionSection() {
  return (
    <section className="bg-monetura-charcoal py-32 lg:py-40">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section label */}
        <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-12">
          How It Works
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start mb-20">
          <h2 className="font-garet font-bold text-3xl md:text-4xl lg:text-5xl text-monetura-cream leading-[1.15]">
            Four steps into
            <br />
            a different calibre
            <br />
            <span className="text-monetura-champagne">of company.</span>
          </h2>
          <p className="text-monetura-cream/50 text-base md:text-lg leading-relaxed lg:pt-4">
            Monetura isn&rsquo;t open to everyone. That&rsquo;s the point. We
            curate for alignment — founders who are building serious things and
            who are serious about community.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-px">
          {steps.map(({ number, title, body }, i) => (
            <div
              key={number}
              className="group grid grid-cols-1 md:grid-cols-[80px_1fr_1fr] gap-6 md:gap-12 items-start py-10 border-t border-monetura-sand/10 hover:border-monetura-champagne/20 transition-colors duration-300"
            >
              <p className="text-monetura-champagne/40 font-garet font-bold text-4xl leading-none group-hover:text-monetura-champagne/60 transition-colors duration-300">
                {number}
              </p>
              <h3 className="font-garet font-bold text-lg md:text-xl text-monetura-cream leading-snug">
                {title}
              </h3>
              <p className="text-monetura-cream/50 text-sm md:text-base leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-monetura-sand/10 pt-16 text-center">
          <a href="/founders/apply" className="btn-champagne">
            Begin Your Application
          </a>
        </div>
      </div>
    </section>
  );
}
