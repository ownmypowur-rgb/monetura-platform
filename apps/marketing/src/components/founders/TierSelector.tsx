"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FOUNDER_TIERS,
  formatTierPrice,
  type FounderTierId,
} from "@monetura/config/src/tiers";

// Marketing copy stays local; names, prices, and taglines come from the
// canonical tier definition in @monetura/config.
const TIER_COPY: Record<
  FounderTierId,
  { description: string; features: string[]; notIncluded: string[] }
> = {
  explorer: {
    description:
      "Full platform and community access. The essential Monetura experience — everything you need to be part of Canada's most curated founder network.",
    features: [
      "Lifetime community platform access",
      "Monetura software (lifetime)",
      "Monthly virtual sessions",
      "Private member directory",
      "Digital resources library",
      "Community forum access",
    ],
    notIncluded: ["In-person events", "Annual retreat", "Advisory opportunities"],
  },
  trailblazer: {
    description:
      "Everything in Explorer, plus in-person access and priority introductions. For founders who want to be in the room, not just in the feed.",
    features: [
      "Everything in Explorer",
      "Priority curated introductions",
      "In-person event access",
      "Quarterly strategy intensives",
      "Early platform feature access",
      "City meetup priority seating",
    ],
    notIncluded: ["Annual retreat (all-inclusive)", "Advisory opportunities"],
  },
  pioneer: {
    description:
      "Everything in Trailblazer, plus quarterly strategy sessions and the earliest access to every new feature we ship. Built for founders building in public.",
    features: [
      "Everything in Trailblazer",
      "Quarterly strategy sessions",
      "First access to every new feature",
      "Founder product input sessions",
      "Extended affiliate commission rate",
    ],
    notIncluded: ["Annual retreat (all-inclusive)"],
  },
  luminary: {
    description:
      "The complete Monetura experience. VIP access to every event, the annual retreat, and the deepest level of founder relationships.",
    features: [
      "Everything in Pioneer",
      "Annual Canadian founder retreat",
      "1:1 introduction calls with founders",
      "Advisory seat opportunities",
      "Founding member wall recognition",
      "Dedicated onboarding call",
    ],
    notIncluded: [],
  },
};

const tiers = FOUNDER_TIERS.map((t) => ({
  id: t.id,
  name: t.name,
  price: `${formatTierPrice(t)} CAD`,
  tagline: t.tagline,
  ...TIER_COPY[t.id],
}));

export default function TierSelector() {
  const [selected, setSelected] = useState<FounderTierId>("trailblazer");
  const activeTier = tiers.find((t) => t.id === selected) ?? tiers[1];

  return (
    <section className="py-24 bg-monetura-mocha">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-12">
          Choose Your Tier
        </p>

        {/* Tab selector */}
        <div className="flex flex-wrap gap-px mb-16 bg-monetura-sand/10">
          {tiers.map(({ id, name, price }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`flex-1 min-w-[45%] sm:min-w-0 py-6 px-4 text-left transition-all duration-200 ${
                selected === id
                  ? "bg-monetura-champagne text-monetura-charcoal"
                  : "bg-monetura-mocha text-monetura-cream/50 hover:text-monetura-cream"
              }`}
            >
              <p
                className={`font-garet font-bold text-base md:text-lg ${
                  selected === id
                    ? "text-monetura-charcoal"
                    : "text-monetura-cream"
                }`}
              >
                {name}
              </p>
              <p
                className={`text-xs mt-1 ${
                  selected === id
                    ? "text-monetura-charcoal/70"
                    : "text-monetura-cream/40"
                }`}
              >
                {price}
              </p>
            </button>
          ))}
        </div>

        {/* Active tier detail */}
        {activeTier && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-4">
                {activeTier.tagline}
              </p>
              <h3 className="font-garet font-bold text-3xl text-monetura-cream mb-6">
                {activeTier.name}
              </h3>
              <p className="text-monetura-cream/50 text-base leading-relaxed mb-10">
                {activeTier.description}
              </p>

              <div className="flex items-baseline gap-2 mb-10">
                <span className="font-garet font-bold text-4xl text-monetura-cream">
                  {activeTier.price}
                </span>
                <span className="text-monetura-cream/40 text-sm">
                  one-time
                </span>
              </div>

              <Link
                href={`/founders/apply?tier=${activeTier.id}`}
                className="btn-champagne"
              >
                Apply as {activeTier.name}
              </Link>
            </div>

            <div>
              <p className="text-monetura-cream/40 text-xs tracking-[0.2em] uppercase mb-6">
                Included
              </p>
              <ul className="space-y-4 mb-10">
                {activeTier.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-sm text-monetura-cream/70"
                  >
                    <span className="text-monetura-champagne mt-0.5 text-xs flex-shrink-0">
                      ✦
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {activeTier.notIncluded.length > 0 && (
                <>
                  <p className="text-monetura-cream/25 text-xs tracking-[0.2em] uppercase mb-4">
                    Not included
                  </p>
                  <ul className="space-y-3">
                    {activeTier.notIncluded.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-3 text-sm text-monetura-cream/25 line-through"
                      >
                        <span className="mt-0.5 text-xs flex-shrink-0">—</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
