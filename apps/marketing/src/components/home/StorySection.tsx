export default function StorySection() {
  return (
    <section className="bg-monetura-cream py-20 sm:py-24 lg:py-40">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 sm:gap-14 lg:grid-cols-2 lg:gap-24 lg:px-12">
        <div>
          <p className="mb-8 text-xs uppercase tracking-[0.24em] text-monetura-sunset font-garet sm:mb-12 sm:tracking-[0.3em]">
            The Origin
          </p>

          <h2 className="font-garet text-3xl leading-[1.12] text-monetura-charcoal md:text-4xl lg:text-5xl">
            I stopped building a life I was supposed to want.
          </h2>

          <div className="mt-8 space-y-5 text-[15px] leading-8 text-monetura-earth sm:mt-10 sm:space-y-6 sm:text-base sm:leading-[1.9] md:text-lg">
            <p>
              In 2024 I had the most successful year of my life. I built a
              company from nothing to $2.3 million in 13 months. The kind of
              number that&apos;s supposed to feel like arrival. It didn&apos;t.
            </p>
            <p>
              I realized I had been disciplined at building a life that society
              told me to want. The revenue. The growth. The system. I was good
              at the system. But I wasn&apos;t living. Not really.
            </p>
            <p>
              There were places I had always wanted to see. Experiences I had
              put off. A version of myself I had quietly set aside to be
              responsible. I made a decision that changed everything — I
              committed to exploring the world. Not someday. Now.
            </p>
            <p>
              People noticed. Not the revenue. They noticed that I was actually
              living — and they wanted to know how. That&apos;s when Monetura was
              born. Not as a business idea. As a belief.
            </p>
          </div>
        </div>

        <div className="lg:pt-16">
          <blockquote className="border-l-[3px] border-monetura-champagne py-1 pl-5 sm:border-l-4 sm:py-2 sm:pl-8">
            <p className="mb-6 font-garet text-lg italic leading-[1.6] text-monetura-charcoal sm:mb-8 sm:text-xl md:text-2xl">
              &ldquo;Passion becomes creation. Creation becomes freedom.&rdquo;
            </p>
            <footer className="flex items-center gap-4">
              <div className="h-px w-8 bg-monetura-champagne" />
              <div>
                <p className="text-sm font-garet tracking-wide text-monetura-charcoal">
                  The Founder
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-[0.15em] text-monetura-earth">
                  Monetura
                </p>
              </div>
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
