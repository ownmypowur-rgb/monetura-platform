const beforeItems = [
  "A camera roll full of photos",
  "A few memories worth sharing",
  "No idea where to start",
  "No time to figure it out",
];

const afterItems = [
  "Full blog post (800+ words)",
  "Instagram caption + hashtags",
  "LinkedIn post",
  "Facebook post",
  "TikTok caption",
  "All published simultaneously",
];

export default function BlogTransformSection() {
  return (
    <section className="bg-monetura-cream py-32 lg:py-40">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <div className="mb-20 grid grid-cols-1 items-end gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-12 text-xs uppercase tracking-[0.3em] text-monetura-sunset font-garet">
              The Content
            </p>
            <h2 className="font-garet text-3xl leading-[1.15] text-monetura-charcoal md:text-4xl lg:text-5xl">
              One photo. One sentence. A full week of content.
            </h2>
          </div>
          <p className="text-base leading-relaxed text-monetura-earth md:text-lg">
            You don't need to be a writer. You just need to have been there.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-[1.75rem] bg-monetura-mocha p-10 text-monetura-cream lg:p-12">
            <p className="text-xs uppercase tracking-[0.3em] text-monetura-terracotta font-garet">
              Before
            </p>
            <h3 className="mt-5 font-garet text-2xl text-monetura-cream">
              What you have
            </h3>
            <ul className="mt-8 space-y-4">
              {beforeItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-monetura-cream/75 md:text-base">
                  <span className="mt-0.5 text-monetura-champagne">◈</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[1.75rem] border border-monetura-champagne bg-monetura-charcoal p-10 text-monetura-cream lg:p-12">
            <p className="text-xs uppercase tracking-[0.3em] text-monetura-champagne font-garet">
              After
            </p>
            <h3 className="mt-5 font-garet text-2xl text-monetura-cream">
              What Monetura creates
            </h3>
            <ul className="mt-8 space-y-4">
              {afterItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-monetura-cream/75 md:text-base">
                  <span className="mt-0.5 text-monetura-champagne">◈</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="mx-auto mt-16 max-w-4xl text-center">
          <blockquote className="font-serif text-3xl leading-[1.3] text-monetura-charcoal md:text-4xl">
            &ldquo;You took hundreds of photos on your last trip. Monetura turns
            every single one into content that earns.&rdquo;
          </blockquote>
          <a
            href="/how-it-works"
            className="mt-10 inline-flex min-h-[52px] items-center justify-center rounded-lg border border-monetura-champagne bg-transparent px-8 py-4 text-center text-xs uppercase tracking-[0.24em] text-monetura-champagne transition-all duration-300 hover:bg-monetura-champagne hover:text-monetura-charcoal"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}
