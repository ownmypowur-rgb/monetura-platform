export default function CTASection() {
  return (
    <section className="bg-monetura-mocha py-32 lg:py-48 text-center">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-14 flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-monetura-champagne/30" />
          <span className="text-xs text-monetura-champagne">◆</span>
          <div className="h-px w-16 bg-monetura-champagne/30" />
        </div>

        <p className="mb-8 text-xs uppercase tracking-[0.3em] text-monetura-champagne font-garet">
          Your Invitation
        </p>

        <h2 className="mb-8 font-garet text-3xl leading-[1.1] text-monetura-cream md:text-5xl lg:text-6xl">
          Turn your next trip
          <br />
          <span className="text-monetura-champagne">into something more.</span>
        </h2>

        <p className="mx-auto mb-14 max-w-xl text-base leading-relaxed text-monetura-cream/50 md:text-lg">
          Founder terms are shared privately on our founders webinar. Be the
          first to know. This is not a course or a mastermind. It&rsquo;s a small,
          chosen community, a place to tell your story, and people to travel
          with, built around the life you already want to live.
        </p>

        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
          <a href="/waitlist" className="btn-champagne">
            Be the first to know
          </a>
          <a
            href="/membership"
            className="text-xs uppercase tracking-[0.2em] text-monetura-cream/50 transition-colors duration-200 hover:text-monetura-cream"
          >
            About the Founders Club →
          </a>
        </div>
      </div>
    </section>
  );
}
