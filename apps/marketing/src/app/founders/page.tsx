import type { Metadata } from "next";
import FounderBenefits from "@/components/founders/FounderBenefits";
import TierSelector from "@/components/founders/TierSelector";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Founder Access — Monetura",
  description:
    "Explore the Monetura founder tiers. 200 spots. Canada only. One payment. Lifetime access.",
};

export default function FoundersPage() {
  return (
    <main className="bg-monetura-charcoal">
      {/* Page hero */}
      <section className="pt-40 pb-24 bg-monetura-charcoal">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-8">
            Founder Access
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
            <h1 className="font-garet font-bold text-4xl md:text-5xl lg:text-6xl text-monetura-cream leading-[1.1]">
              This is not
              <br />
              for everyone.
              <br />
              <span className="text-monetura-champagne">That&rsquo;s the point.</span>
            </h1>
            <div className="space-y-6">
              <p className="text-monetura-cream/50 text-base md:text-lg leading-relaxed">
                Monetura is a curated founder community — 200 seats, Canada
                only, lifetime access. Applications are reviewed personally.
                There is no open checkout.
              </p>
              <Link href="/founders/apply" className="btn-champagne inline-block">
                Apply for Founder Access
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FounderBenefits />
      <TierSelector />

      {/* Final CTA */}
      <section className="py-24 bg-monetura-charcoal border-t border-monetura-sand/10 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-6">
            Ready?
          </p>
          <h2 className="font-garet font-bold text-3xl md:text-4xl text-monetura-cream mb-8">
            47 spots remaining.
          </h2>
          <Link href="/founders/apply" className="btn-champagne">
            Begin Your Application
          </Link>
        </div>
      </section>
    </main>
  );
}
