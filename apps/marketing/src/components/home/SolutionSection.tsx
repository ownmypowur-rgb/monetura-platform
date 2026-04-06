const steps = [
  {
    number: "01",
    title: "Book and go",
    body: "Access exclusive member travel rates through our partner network. Hotels, flights, and experiences at prices the public can't touch.",
  },
  {
    number: "02",
    title: "Capture and create",
    body: "Take photos. Write one sentence of notes. Monetura's AI turns your raw experience into a full blog post, Instagram caption, LinkedIn post, TikTok caption, and hashtags — in seconds.",
  },
  {
    number: "03",
    title: "Publish and earn",
    body: "Your content goes out to all your social platforms simultaneously — with your unique affiliate link embedded in every post. When someone joins Monetura through your content, you earn. Three active referrals and your membership pays for itself.",
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
            Three steps from
            <br />
            <span className="text-monetura-champagne">trip to income.</span>
          </h2>
          <p className="text-monetura-cream/50 text-base md:text-lg leading-relaxed lg:pt-4">
            No content experience required. No existing audience needed. Just
            your experiences, Monetura&rsquo;s AI, and a few minutes after each
            trip.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-px">
          {steps.map(({ number, title, body }) => (
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
            Apply for Founder Access
          </a>
        </div>
      </div>
    </section>
  );
}
