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
          200 founders. One payment. Lifetime access. This is not a course.
          This is not a mastermind. This is a platform, a business model, and a
          community — built around the life you already want to live.
        </p>

        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
          <a href="/founders/apply" className="btn-champagne">
            Apply for Founder Access
          </a>
          <a
            href="/founders"
            className="text-xs uppercase tracking-[0.2em] text-monetura-cream/50 transition-colors duration-200 hover:text-monetura-cream"
          >
            View Founder Benefits →
          </a>
        </div>
      </div>
    </section>
  );
}
