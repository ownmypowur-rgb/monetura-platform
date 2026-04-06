export default function StorySection() {
  return (
    <section className="bg-monetura-cream py-32 lg:py-40">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section label */}
        <p className="text-monetura-sunset text-xs tracking-[0.3em] uppercase font-garet mb-12">
          What is Monetura?
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Story copy */}
          <div>
            <h2 className="font-garet font-bold text-3xl md:text-4xl lg:text-5xl text-monetura-charcoal leading-[1.15] mb-10">
              Travel more.
              <br />
              Spend less.
              <br />
              Earn while you do it.
            </h2>

            <div className="space-y-6 text-monetura-earth text-base md:text-lg leading-[1.9]">
              <p>
                Most people treat travel as an expense. A cost. Something you
                budget for and recover from when you get home.
              </p>
              <p>
                Monetura changes that completely. We built a platform that takes
                your existing passion for travel — the photos, the stories, the
                places you&rsquo;ve been and the ones you&rsquo;re going — and
                turns all of it into content, income, and opportunity.
              </p>
              <p>
                You don&rsquo;t need to be an influencer. You don&rsquo;t need
                a following. You just need to love what you&rsquo;re already
                doing.
              </p>
            </div>

            <div className="mt-12">
              <a
                href="/founders/apply"
                className="btn-champagne text-xs py-3 px-8"
                style={{ borderColor: "#D4A853", color: "#D4A853" }}
              >
                Apply for Founder Access
              </a>
            </div>
          </div>

          {/* Pull quote */}
          <div className="lg:pt-16">
            <blockquote className="border-l-4 border-monetura-champagne pl-8 py-2">
              <p className="font-garet font-bold text-xl md:text-2xl text-monetura-charcoal leading-[1.6] italic mb-8">
                &ldquo;Every trip you take is already worth sharing. Monetura
                makes it worth earning from too.&rdquo;
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
                  AI
                </p>
                <p className="text-monetura-earth text-xs tracking-[0.15em] uppercase">
                  Powered content
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
