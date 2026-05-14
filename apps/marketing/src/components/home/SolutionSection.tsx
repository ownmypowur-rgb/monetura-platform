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
    <section className="bg-monetura-charcoal py-20 sm:py-24 lg:py-40">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section label */}
        <p className="mb-8 text-monetura-champagne text-xs uppercase tracking-[0.24em] font-garet sm:mb-12 sm:tracking-[0.3em]">
          How It Works
        </p>

        <div className="mb-12 grid grid-cols-1 items-start gap-8 sm:mb-16 sm:gap-10 lg:mb-20 lg:grid-cols-2 lg:gap-24">
          <h2 className="font-garet text-3xl text-monetura-cream leading-[1.15] md:text-4xl lg:text-5xl">
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
              className="group grid grid-cols-1 gap-4 border-t border-monetura-sand/10 py-8 transition-colors duration-300 hover:border-monetura-champagne/20 sm:gap-6 sm:py-10 md:grid-cols-[72px_1fr_1fr] md:gap-10 lg:gap-12"
            >
              <p className="font-garet text-3xl leading-none text-monetura-champagne/40 transition-colors duration-300 group-hover:text-monetura-champagne/60 sm:text-4xl">
                {number}
              </p>
              <h3 className="font-garet text-lg leading-snug text-monetura-cream md:text-xl">
                {title}
              </h3>
              <p className="text-monetura-cream/50 text-sm md:text-base leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-monetura-sand/10 pt-12 text-center sm:mt-16 sm:pt-16">
          <a href="/founders/apply" className="btn-champagne">
            Apply for Founder Access
          </a>
        </div>
      </div>
    </section>
  );
}
