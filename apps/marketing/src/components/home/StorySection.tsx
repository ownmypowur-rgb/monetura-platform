export default function StorySection() {
  return (
    <section className="bg-monetura-cream py-32 lg:py-40">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section label */}
        <p className="text-monetura-sunset text-xs tracking-[0.3em] uppercase font-garet mb-12">
          The Origin
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Story copy */}
          <div>
            <h2 className="font-garet font-bold text-3xl md:text-4xl lg:text-5xl text-monetura-charcoal leading-[1.15] mb-10">
              Built by founders,
              <br />
              for founders.
            </h2>

            <div className="space-y-6 text-monetura-earth text-base md:text-lg leading-[1.9]">
              <p>
                I built my first business at 24. No roadmap. No mentor who
                understood what it meant to build something from nothing while
                everyone around you was clocking in and clocking out.
              </p>
              <p>
                What I needed wasn't another course. It wasn't a mastermind
                with strangers on Zoom. I needed a room — physical or
                digital — full of people who were already living the life I
                was building toward. People with skin in the game. People who
                understood leverage, freedom, and the cost of both.
              </p>
              <p>
                Monetura is that room. And we've kept it small on purpose.
              </p>
            </div>

            <div className="mt-12">
              <a href="/story" className="btn-champagne text-xs py-3 px-8" style={{ borderColor: '#D4A853', color: '#D4A853' }}>
                Read the full story
              </a>
            </div>
          </div>

          {/* Pull quote */}
          <div className="lg:pt-16">
            <blockquote className="border-l-4 border-monetura-champagne pl-8 py-2">
              <p className="font-garet font-bold text-xl md:text-2xl text-monetura-charcoal leading-[1.6] italic mb-8">
                &ldquo;The most expensive thing you can do is surround yourself
                with people who don&rsquo;t understand what you&rsquo;re
                building.&rdquo;
              </p>
              <footer className="flex items-center gap-4">
                <div className="w-8 h-px bg-monetura-champagne" />
                <div>
                  <p className="text-monetura-charcoal text-sm font-garet font-bold tracking-wide">
                    The Founder
                  </p>
                  <p className="text-monetura-earth text-xs tracking-[0.15em] uppercase mt-0.5">
                    Monetura
                  </p>
                </div>
              </footer>
            </blockquote>

            {/* Decorative numbers */}
            <div className="mt-20 grid grid-cols-2 gap-8">
              <div className="border-t border-monetura-sand pt-6">
                <p className="font-garet font-bold text-3xl text-monetura-charcoal mb-1">
                  7+
                </p>
                <p className="text-monetura-earth text-xs tracking-[0.15em] uppercase">
                  Years building
                </p>
              </div>
              <div className="border-t border-monetura-sand pt-6">
                <p className="font-garet font-bold text-3xl text-monetura-charcoal mb-1">
                  200
                </p>
                <p className="text-monetura-earth text-xs tracking-[0.15em] uppercase">
                  Founders max
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
