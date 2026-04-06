"use client";

import { useState } from "react";
import Link from "next/link";

const tiers = [
  {
    id: "explorer",
    name: "Explorer",
    price: "$2,500 CAD",
    tagline: "The foundation",
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
    notIncluded: [
      "In-person events",
      "Annual retreat",
      "Advisory opportunities",
    ],
  },
  {
    id: "trailblazer",
    name: "Trailblazer",
    price: "$3,500 CAD",
    tagline: "The inner circle",
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
  {
    id: "luminary",
    name: "Luminary",
    price: "$5,500 CAD",
    tagline: "The pinnacle",
    description:
      "The complete Monetura experience. VIP access to every event, the annual retreat, and the deepest level of founder relationships.",
    features: [
      "Everything in Trailblazer",
      "Annual Canadian founder retreat",
      "1:1 introduction calls with founders",
      "Advisory seat opportunities",
      "Founding member wall recognition",
      "Dedicated onboarding call",
    ],
    notIncluded: [],
  },
];

export default function TierSelector() {
  const [selected, setSelected] = useState("trailblazer");
  const activeTier = tiers.find((t) => t.id === selected) ?? tiers[1];

  return (
    <section className="py-24 bg-monetura-mocha">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-12">
          Choose Your Tier
        </p>

        {/* Tab selector */}
        <div className="flex gap-px mb-16 bg-monetura-sand/10">
          {tiers.map(({ id, name, price }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`flex-1 py-6 px-4 text-left transition-all duration-200 ${
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
