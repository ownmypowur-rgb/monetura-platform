import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works: Founders Club, Monetura",
  description:
    "How the Monetura Founders Club works: join the waitlist, meet us on a private webinar, then find your way back.",
  alternates: { canonical: "/how-it-works" },
};

const steps = [
  {
    number: "01",
    title: "Be the first to know",
    subtitle: "Join the waitlist.",
    body: "Add your first name and email. Nothing to buy, nothing to decide yet.",
    detail: "We\u2019ll email you when something is ready, and you can unsubscribe at any time.",
  },
  {
    number: "02",
    title: "The founders webinar",
    subtitle: "By invitation.",
    body: "Waitlist members are invited first to a private webinar, where Darryl shares what Monetura is, who it\u2019s for, and the founder terms.",
    detail: "Come with questions. There\u2019s no pressure to decide on the call.",
  },
  {
    number: "03",
    title: "Join, if it feels right",
    subtitle: "Arranged personally.",
    body: "Founders join after the webinar. Payment is arranged personally, never through an open checkout.",
    detail: "Founder access is a relationship, not a transaction.",
  },
  {
    number: "04",
    title: "Find your way back",
    subtitle: "Welcome in.",
    body: "You\u2019ll get platform access, a personal welcome, and the people who left too.",
    detail: "Your next trip, your next story, and a tribe to plan it with.",
  },
];

const faqs = [
  {
    q: "Why isn\u2019t there a price on the site?",
    a: "Founder terms are shared privately on the founders webinar. It\u2019s how we make sure every founder is a good fit, and that no one feels pushed.",
  },
  {
    q: "Do I need to be a content creator?",
    a: "No. If you take photos when you travel, you have what you need. Monetura helps you turn them into stories for your own pages.",
  },
  {
    q: "Who is Monetura for?",
    a: "People who\u2019ve spent years living for everyone else and are ready to travel more, with people who get it.",
  },
  {
    q: "Is Monetura available outside Canada?",
    a: "Not yet. We\u2019re starting in Canada.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="bg-monetura-charcoal min-h-screen">
      {/* Hero */}
      <section className="pt-40 pb-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-8">
            The Process
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
            <h1 className="font-garet font-bold text-4xl md:text-5xl lg:text-6xl text-monetura-cream leading-[1.1]">
              Four steps.
              <br />
              <span className="text-monetura-champagne">One welcome.</span>
            </h1>
            <p className="text-monetura-cream/50 text-base md:text-lg leading-relaxed">
              No checkout, no pressure. Founders join by invitation, after a
              private webinar.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="space-y-px">
            {steps.map(({ number, title, subtitle, body, detail }) => (
              <div
                key={number}
                className="border-t border-monetura-sand/10 py-16 grid grid-cols-1 lg:grid-cols-[100px_1fr_1fr] gap-8 lg:gap-16"
              >
                <p className="text-monetura-champagne/30 font-garet font-bold text-5xl leading-none">
                  {number}
                </p>
                <div>
                  <p className="text-monetura-champagne text-xs tracking-[0.2em] uppercase font-garet mb-3">
                    {subtitle}
                  </p>
                  <h2 className="font-garet font-bold text-2xl md:text-3xl text-monetura-cream mb-4">
                    {title}
                  </h2>
                  <p className="text-monetura-cream/60 text-base leading-relaxed">
                    {body}
                  </p>
                </div>
                <div className="lg:pt-8">
                  <p className="text-monetura-cream/35 text-sm leading-relaxed">
                    {detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-monetura-mocha py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-12">
            Common Questions
          </p>

          <div className="space-y-px">
            {faqs.map(({ q, a }) => (
              <div
                key={q}
                className="border-t border-monetura-cream/10 py-8 grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <p className="font-garet font-bold text-base text-monetura-cream">
                  {q}
                </p>
                <p className="text-monetura-cream/50 text-sm leading-relaxed">
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center border-t border-monetura-sand/10">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="font-garet font-bold text-3xl text-monetura-cream mb-8">
            Ready when you are.
          </h2>
          <Link href="/waitlist" className="btn-champagne">
            Be the first to know
          </Link>
        </div>
      </section>
    </main>
  );
}
