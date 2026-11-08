import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Story: Monetura",
  description:
    "The story behind Monetura. Passion becomes creation. Creation becomes freedom.",
  alternates: { canonical: "/story" },
};

export default function StoryPage() {
  return (
    <main className="bg-monetura-charcoal min-h-screen">
      {/* Hero */}
      <section className="pt-40 pb-24 bg-monetura-charcoal">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-8">
            The Origin
          </p>
          <h1 className="font-garet font-bold text-4xl md:text-5xl lg:text-6xl text-monetura-cream leading-[1.1]">
            I stopped building a life{" "}
            <span className="text-monetura-champagne">
              I was supposed to want.
            </span>
          </h1>
        </div>
      </section>

      {/* Story body */}
      <section className="bg-monetura-cream py-24 md:py-32">
        <div className="max-w-[680px] mx-auto px-6">
          <div className="space-y-8 text-monetura-earth text-base md:text-lg leading-[2]">
            <p>
              In 2024 I had the most successful year of my life. It was
              supposed to feel like arrival. It didn&rsquo;t.
            </p>

            <p>
              I realized I had been disciplined at building a life that society
              told me to want. The revenue. The growth. The system. I was good
              at the system. But I wasn&rsquo;t living. Not really.
            </p>

            <p>
              There were places I had always wanted to see. Experiences I had
              put off. A version of myself I had quietly set aside to be
              responsible. I made a decision that changed everything — I
              committed to exploring the world. Not someday. Now.
            </p>

            <blockquote className="border-l-4 border-monetura-champagne pl-8 py-2 !my-12">
              <p className="font-garet font-bold text-xl md:text-2xl text-monetura-charcoal leading-[1.6]">
                &ldquo;Not someday. Now.&rdquo;
              </p>
            </blockquote>

            <p>
              People noticed. Not the revenue. They noticed that I was actually
              living — and they wanted to know how. That&rsquo;s when Monetura
              was born. Not as a business idea. As a belief.
            </p>
          </div>

          <div className="mt-20 pt-16 border-t border-monetura-sand text-center">
            {/* Closing line. Sunset Gold is the brand's tagline colour on light
                backgrounds; this section sits on cream. */}
            <p className="font-garet text-monetura-sunset text-2xl md:text-4xl leading-snug tracking-[0.02em]">
              Passion becomes creation. Creation becomes freedom.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="h-px w-8 bg-monetura-champagne" />
              <p className="text-sm font-garet tracking-wide text-monetura-charcoal">
                The Founder, Monetura
              </p>
              <div className="h-px w-8 bg-monetura-champagne" />
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center">
              <Link href="/waitlist" className="btn-primary">
                Be the first to know
              </Link>
              <Link
                href="/how-it-works"
                className="text-monetura-earth hover:text-monetura-charcoal text-xs tracking-[0.2em] uppercase transition-colors duration-200 py-4"
              >
                How It Works →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
