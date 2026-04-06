import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story — Monetura",
  description:
    "The story behind Monetura — why we built Canada's most curated founder community.",
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
          <h1 className="font-garet font-bold text-4xl md:text-5xl lg:text-6xl text-monetura-cream leading-[1.1] mb-10">
            Every room I entered
            <br />
            <span className="text-monetura-champagne">
              was the wrong room.
            </span>
          </h1>
          <p className="text-monetura-cream/50 text-lg leading-relaxed max-w-2xl">
            So we built the right one.
          </p>
        </div>
      </section>

      {/* Story body */}
      <section className="bg-monetura-cream py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <div className="prose prose-lg max-w-none">
            <div className="space-y-8 text-monetura-earth text-base md:text-lg leading-[2]">
              <p>
                I started my first company the same way most people do — with
                more conviction than capital, more vision than validation. I
                figured the rest would come if the work was good enough. And
                eventually, it did. But the years in between were lonelier than
                anyone told me they would be.
              </p>

              <p>
                Not lonely in the personal sense. I had people around me. But
                professionally? The people who understood what I was building —
                the ones who could speak the language of leverage, of asymmetric
                risk, of what it actually feels like to have your identity
                wrapped up in a business that might not make it — those people
                were invisible to me for years.
              </p>

              <blockquote className="border-l-4 border-monetura-champagne pl-8 py-2 my-12">
                <p className="font-garet font-bold text-xl md:text-2xl text-monetura-charcoal leading-[1.6] italic not-italic">
                  &ldquo;The most expensive thing you can do is surround
                  yourself with people who don&rsquo;t understand what
                  you&rsquo;re building.&rdquo;
                </p>
              </blockquote>

              <p>
                I tried the masterminds. Some were good — most were
                disappointing. The better ones cost a fortune and delivered
                connections with people at completely different stages. The
                cheaper ones were filled with people who were still convincing
                themselves that entrepreneurship was viable. Neither was the
                room I needed.
              </p>

              <p>
                Canada has incredible founders. People quietly building
                eight-figure businesses in Calgary, Montreal, Halifax —
                operators who have no interest in being influencers, who just
                want to build serious things with serious people. That network
                exists. It&rsquo;s just invisible unless someone builds the
                infrastructure to surface it.
              </p>

              <p>
                That&rsquo;s what Monetura is. An infrastructure for the
                founder network that should exist in Canada and hasn&rsquo;t
                yet. Curated. Capped. Permanent.
              </p>

              <p>
                200 founders. That&rsquo;s it. Not because we can&rsquo;t
                grow — because we won&rsquo;t. The value of this network is
                entirely dependent on who is in it. And that means choosing
                carefully, every time.
              </p>
            </div>
          </div>

          <div className="mt-20 pt-16 border-t border-monetura-sand">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <a href="/founders/apply" className="btn-champagne" style={{ borderColor: '#D4A853', color: '#D4A853' }}>
                Apply for Founder Access
              </a>
              <a
                href="/how-it-works"
                className="text-monetura-earth hover:text-monetura-charcoal text-xs tracking-[0.2em] uppercase transition-colors duration-200 py-4"
              >
                How It Works →
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
