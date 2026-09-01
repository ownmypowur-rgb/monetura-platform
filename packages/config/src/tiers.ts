/**
 * Canonical founder tier definitions — the single source of truth.
 *
 * Consumed by: marketing TiersSection + TierSelector + founders/apply form,
 * the marketing apply API route, the admin founders console, and the
 * platform concierge prompt. Do not redefine tier names or prices anywhere else.
 */

export type FounderTierId = "explorer" | "trailblazer" | "pioneer" | "luminary";
export type TierInterest = "entry" | "core" | "elite" | "platinum";
export type FounderKeyTier = "bronze" | "silver" | "gold";

export interface FounderTier {
  id: FounderTierId;
  name: string;
  tagline: string;
  /** One-time price in CAD dollars. */
  priceCad: number;
  /** Value stored in monetura_members.tier_interest. */
  tierInterest: TierInterest;
  /** Value stored in monetura_founder_keys.founder_tier on activation. */
  founderKeyTier: FounderKeyTier;
  /** Monthly AI credits for founder-tier members (see packages/db credits). */
  creditsPerMonth: number;
}

export const TOTAL_FOUNDER_SPOTS = 200;

export const FOUNDER_TIERS: readonly FounderTier[] = [
  {
    id: "explorer",
    name: "Explorer",
    tagline: "The foundation",
    priceCad: 2500,
    tierInterest: "entry",
    founderKeyTier: "bronze",
    creditsPerMonth: 500,
  },
  {
    id: "trailblazer",
    name: "Trailblazer",
    tagline: "The inner circle",
    priceCad: 3500,
    tierInterest: "core",
    founderKeyTier: "silver",
    creditsPerMonth: 500,
  },
  {
    id: "pioneer",
    name: "Pioneer",
    tagline: "The builder",
    priceCad: 4500,
    tierInterest: "elite",
    founderKeyTier: "gold",
    creditsPerMonth: 500,
  },
  {
    id: "luminary",
    name: "Luminary",
    tagline: "The pinnacle",
    priceCad: 5500,
    tierInterest: "platinum",
    founderKeyTier: "gold",
    creditsPerMonth: 500,
  },
] as const;

/** "$2,500" — price without currency suffix. */
export function formatTierPrice(tier: FounderTier): string {
  return `$${tier.priceCad.toLocaleString("en-CA")}`;
}

export function founderTierById(id: string): FounderTier | undefined {
  return FOUNDER_TIERS.find((t) => t.id === id);
}

export function founderTierByInterest(
  interest: TierInterest
): FounderTier | undefined {
  return FOUNDER_TIERS.find((t) => t.tierInterest === interest);
}
