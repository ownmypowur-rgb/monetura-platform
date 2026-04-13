import Image from "next/image";

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

        <div className="mb-8 overflow-hidden rounded-[2rem] border border-monetura-sand bg-white/50">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[20rem] lg:min-h-[26rem]">
              <Image
                src="/images/monetura-hero-reference.jpg"
                alt="Luxury travel editorial scene suited to content creation"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(44,36,32,0.16)_0%,rgba(44,36,32,0.02)_35%,rgba(44,36,32,0.64)_100%)]" />
            </div>
            <div className="flex items-center bg-monetura-charcoal/95 p-8 text-monetura-cream sm:p-10 lg:p-12">
              <div>
                <p className="text-xs uppercase tracking-[0.34em] text-monetura-champagne font-garet">
                  From memory to media
                </p>
                <h3 className="mt-5 font-garet text-2xl leading-tight text-monetura-cream lg:text-[2rem]">
                  Your trip already contains the raw material.
                </h3>
                <p className="mt-5 text-sm leading-7 text-monetura-cream/68 md:text-[15px]">
                  The photos, the atmosphere, the tiny details people remember —
                  Monetura turns those fragments into polished content that feels
                  considered, personal, and ready to publish.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="relative overflow-hidden rounded-[1.75rem] bg-monetura-mocha p-10 text-monetura-cream lg:p-12">
            <div className="absolute inset-0 opacity-20">
              <Image
                src="/images/monetura-rooftop.jpg"
                alt="Luxury city travel content inspiration"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(74,55,40,0.68)_0%,rgba(74,55,40,0.92)_100%)]" />
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.3em] text-monetura-terracotta font-garet">
                Before
              </p>
              <h3 className="mt-5 font-garet text-2xl text-monetura-cream">
                What you have
              </h3>
              <ul className="mt-8 space-y-4">
                {beforeItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm leading-relaxed text-monetura-cream/80 md:text-base"
                  >
                    <span className="mt-0.5 text-monetura-champagne">◈</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[1.75rem] border border-monetura-champagne bg-monetura-charcoal p-10 text-monetura-cream lg:p-12">
            <div className="absolute inset-0 opacity-20">
              <Image
                src="/images/monetura-tropical.jpg"
                alt="Tropical travel inspiration for Monetura content output"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(44,36,32,0.74)_0%,rgba(44,36,32,0.94)_100%)]" />
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.3em] text-monetura-champagne font-garet">
                After
              </p>
              <h3 className="mt-5 font-garet text-2xl text-monetura-cream">
                What Monetura creates
              </h3>
              <ul className="mt-8 space-y-4">
                {afterItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm leading-relaxed text-monetura-cream/80 md:text-base"
                  >
                    <span className="mt-0.5 text-monetura-champagne">◈</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
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
