export default function CTASection() {
  return (
    <section className="bg-monetura-mocha py-32 lg:py-48 text-center">
      <div className="max-w-3xl mx-auto px-6">
        {/* Ornament */}
        <div className="flex items-center justify-center gap-4 mb-14">
          <div className="w-16 h-px bg-monetura-champagne/30" />
          <span className="text-monetura-champagne text-xs">◆</span>
          <div className="w-16 h-px bg-monetura-champagne/30" />
        </div>

        <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-8">
          Your Invitation
        </p>

        <h2 className="font-garet font-bold text-3xl md:text-5xl lg:text-6xl text-monetura-cream leading-[1.1] mb-8">
          The room is waiting.
          <br />
          <span className="text-monetura-champagne">Are you ready?</span>
        </h2>

        <p className="text-monetura-cream/50 text-base md:text-lg leading-relaxed mb-14 max-w-xl mx-auto">
          200 founders. Canada only. One payment. Lifetime access. This is not
          a course. This is not a mastermind. This is your people.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <a href="/founders/apply" className="btn-champagne">
            Apply for Founder Access
          </a>
          <a
            href="/founders"
            className="text-monetura-cream/50 hover:text-monetura-cream text-xs tracking-[0.2em] uppercase transition-colors duration-200"
          >
            View Founder Benefits →
          </a>
        </div>

        {/* Fine print */}
        <p className="text-monetura-cream/20 text-xs tracking-wide mt-16">
          Canada only &nbsp;·&nbsp; Limited to 200 founders &nbsp;·&nbsp;
          Applications reviewed personally
        </p>
      </div>
    </section>
  );
}
