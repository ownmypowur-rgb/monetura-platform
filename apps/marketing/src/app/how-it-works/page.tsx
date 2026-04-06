import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works — Monetura",
  description:
    "From application to lifetime access — how Monetura founder membership works.",
};

const steps = [
  {
    number: "01",
    title: "Apply",
    subtitle: "Not a checkout. A conversation.",
    body: "Complete the founder application. Tell us about your business, your goals, and why Monetura is the right room for you right now. We read every word personally.",
    detail:
      "Applications take approximately 10 minutes to complete. We ask about your business stage, your goals, and what you're looking for in a founder network. There's no trick to it — we're looking for alignment.",
  },
  {
    number: "02",
    title: "Review",
    subtitle: "5 business days.",
    body: "Every application is reviewed by the Monetura founding team. We're not looking for the most successful founders — we're looking for the most aligned ones.",
    detail:
      "We assess fit based on stage, industry, values, and what you're looking to contribute to the community — not just what you're looking to extract from it.",
  },
  {
    number: "03",
    title: "Accept & Choose Your Tier",
    subtitle: "One payment. Lifetime access.",
    body: "Approved founders choose their tier — Explorer ($2,500), Trailblazer ($3,500), or Luminary ($5,500) — and complete their one-time payment via e-transfer or wire to ATB Bank.",
    detail:
      "Payment is not processed through Stripe or any payment platform. This is intentional. Founder access is a relationship, not a transaction.",
  },
  {
    number: "04",
    title: "Onboard",
    subtitle: "Welcome to the room.",
    body: "You'll receive full platform access, an onboarding call (Luminary tier), and your first curated introduction within your first week.",
    detail:
      "We don't just open the door and leave you in an empty room. Every new founder gets a personal welcome and at least one warm introduction to another member who is building something relevant to your work.",
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
              <span className="text-monetura-champagne">One lifetime.</span>
            </h1>
            <p className="text-monetura-cream/50 text-base md:text-lg leading-relaxed">
              The process is intentionally straightforward. The curation is what
              makes it work — not the complexity of the onboarding.
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
            {[
              {
                q: "Why e-transfer instead of online payment?",
                a: "Founder access is a relationship, not a SaaS subscription. The payment method is intentional — it filters for seriousness and creates a real human touchpoint at the start of the membership.",
              },
              {
                q: "Is there a refund policy?",
                a: "Given the curated nature of the community and the lifetime access model, founder payments are non-refundable. We take the application process seriously precisely because of this.",
              },
              {
                q: "Can I upgrade my tier later?",
                a: "Yes. Founders can upgrade from Explorer to Trailblazer or Luminary by paying the tier difference. Upgrades are subject to availability.",
              },
              {
                q: "How soon after acceptance do I get access?",
                a: "Platform access is granted within 24 hours of payment confirmation. Onboarding calls (Luminary) are scheduled within the first week.",
              },
            ].map(({ q, a }) => (
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
            Ready to apply?
          </h2>
          <Link href="/founders/apply" className="btn-champagne">
            Begin Your Application
          </Link>
        </div>
      </section>
    </main>
  );
}
