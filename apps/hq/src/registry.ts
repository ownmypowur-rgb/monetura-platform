/**
 * DIVISION REGISTRY: the single source of truth for Monetura HQ.
 *
 * The scene, HUD, tour, API and demo generator all read from here. Add a division
 * or an agent to DIVISIONS and it appears on the island with no other code change.
 *
 * SERVER ONLY in practice: never import this from a client component. Pages pass
 * a projection down as props (see server/projection.ts), so private fields such as
 * tools, models and specialties never enter the public /tour payload or bundle.
 * ESLint enforces this for src/scene, src/hud and src/world.
 *
 * Character names are placeholder config values.
 */
import { ORCHESTRATOR_BUILDING, ORCHESTRATOR_NAME } from "./config/brand";
import type {
  AgentStatus,
  BuildingConfig,
  CharacterAppearance,
  DivisionStatus,
  IconName,
} from "./types";

export interface RegistryAgent {
  id: string;
  name: string;
  role: string;
  specialty: string;
  model: string;
  tools: string[];
  status: AgentStatus;
  appearance: CharacterAppearance;
  /** Index into the building's desk slots. Extra agents wrap around. */
  homeDesk: number;
}

export interface RegistryDivision {
  id: string;
  name: string;
  subtitle: string;
  icon: IconName;
  building: BuildingConfig;
  status: DivisionStatus;
  description: string;
  nextUp: string;
  /** Optional grouping for the HUD, e.g. the internal cluster. */
  group?: string;
  /** Fully staffed regardless of status (the flagship). Otherwise derived from status. */
  fullyStaffed?: boolean;
  agents: RegistryAgent[];
}

/** Appearance palette. Edit freely: diverse skin tones, hair and resort-casual outfits. */
const SKIN = { a: "#f1cfb4", b: "#e3b18c", c: "#c98d62", d: "#a56b45", e: "#7c4d30", f: "#5a3621" };
const HAIR = { black: "#17110d", brown: "#3b2415", auburn: "#6a3218", blonde: "#b98f55", grey: "#8b8680" };

function look(
  skin: string,
  hair: string,
  hairStyle: CharacterAppearance["hairStyle"],
  top: string,
  bottom: string,
  extra: Partial<CharacterAppearance> = {},
): CharacterAppearance {
  return { skin, hair, hairStyle, top, bottom, shoes: "#3a2c22", ...extra };
}

function agent(
  id: string,
  name: string,
  role: string,
  specialty: string,
  model: string,
  tools: string[],
  appearance: CharacterAppearance,
  homeDesk: number,
  status: AgentStatus = "idle",
): RegistryAgent {
  return { id, name, role, specialty, model, tools, appearance, homeDesk, status };
}

export const DIVISIONS: RegistryDivision[] = [
  {
    id: "atlas-command",
    name: ORCHESTRATOR_BUILDING,
    subtitle: "Operations & Orchestration",
    icon: "palm",
    status: "live",
    description: `${ORCHESTRATOR_NAME} runs the launch plan, sets priorities, writes build prompts, routes work to departments and surfaces approvals.`,
    nextUp: "Design Content Studio with Darryl and add it as Atlas's first department agent.",
    building: { x: 0, z: -96, elevation: 37, rotation: 0, scale: 1, footprint: "tiered", interior: "command" },
    fullyStaffed: true,
    agents: [
      agent("atlas", ORCHESTRATOR_NAME, "Director", "Director: runs the launch plan, daily briefing, sprint prompts and prospect conversation prep.", "Claude Opus", ["Company brain", "Task list", "Sprint prompts", "HQ event tool"], look(SKIN.c, HAIR.black, "long", "#f4efe6", "#3d4a5c", { feminine: true }), 0, "working"),
      agent("atlas-ops", "Remy", "Workflow Coordinator", "Keeps queues moving between departments and flags stuck handoffs.", "Claude Sonnet", ["Queue monitor", "Event log"], look(SKIN.b, HAIR.brown, "short", "#6f8fa8", "#e8dccb"), 1),
    ],
  },
  {
    id: "content-studio",
    name: "Content Studio",
    subtitle: "Content Creation & Editing",
    icon: "play",
    status: "building",
    description: "Turning travel experiences into high-performing content: intake, edit, design, copy, channel variants and creative QA.",
    nextUp: "Wire the media intake pipeline and the first editing agents to real uploads.",
    building: { x: 0, z: 62, elevation: 11, rotation: 0, scale: 1.3, footprint: "angular", interior: "studio" },
    fullyStaffed: true,
    agents: [
      agent("creative-director", "Zara", "Creative Director", "Briefing, brand voice, task routing, quality gates and production priorities.", "Claude Opus", ["Brief builder", "Brand voice guide", "Review queue"], look(SKIN.a, HAIR.blonde, "long", "#f6f0e4", "#c9b48f", { feminine: true }), 0, "meeting"),
      agent("media-librarian", "Noor", "Media Librarian", "Intake and tagging: location and subject tags, duplicates, metadata and permissions.", "Claude Haiku", ["S3 media store", "Vision tagger", "Rights checklist"], look(SKIN.d, HAIR.black, "bun", "#d9a24e", "#2f3a48", { feminine: true }), 1, "working"),
      agent("video-editor", "Ava", "Video Editor", "Reels, shorts and travel montages: captions, versions and aspect ratios.", "Seedance", ["Timeline editor", "Subtitle engine", "Seedance"], look(SKIN.c, HAIR.brown, "curly", "#f3f1ec", "#27303c", { feminine: true, headphones: true }), 2, "working"),
      agent("photo-specialist", "Maya", "Photo Specialist", "Selects, enhancement and curation of trip photo sets.", "OpenAI", ["Image enhancer", "Selects board"], look(SKIN.e, HAIR.black, "curly", "#c17a4a", "#efe6d6", { feminine: true }), 3, "working"),
      agent("designer", "Kai", "Designer", "Thumbnails, carousels, branded layouts and landing page imagery.", "OpenAI", ["Layout templates", "Image generator"], look(SKIN.b, HAIR.black, "short", "#1f5e7a", "#d8c7a8", { print: "#f1e6cf", headphones: true }), 4, "working"),
      agent("copywriter", "Leo", "Copy & Caption Writer", "Captions, hooks, scripts and travel stories in the Monetura voice.", "Claude Sonnet", ["Voice guide", "Caption library"], look(SKIN.c, HAIR.black, "short", "#7fa7c9", "#3a3a3a"), 5, "working"),
      agent("facebook-specialist", "Sofia", "Facebook Specialist", "Long-form posts, community framing and Facebook creative variants.", "Claude Sonnet", ["Channel format guide", "bundle.social drafts"], look(SKIN.a, HAIR.auburn, "ponytail", "#a8c3a0", "#2c3440", { feminine: true }), 6, "idle"),
      agent("instagram-specialist", "Mateo", "Instagram Specialist", "Reels, carousels, hashtags and engagement strategy.", "Claude Sonnet", ["Channel format guide", "Hashtag research"], look(SKIN.d, HAIR.brown, "short", "#e8dccb", "#4a3728"), 7, "working"),
      agent("tiktok-specialist", "Jin", "TikTok Specialist", "Short-form trends, hooks and casual voice variants.", "Claude Haiku", ["Trend watcher", "Hook library"], look(SKIN.b, HAIR.black, "short", "#2c2420", "#8b6e52", { headphones: true }), 8, "working"),
      agent("youtube-specialist", "Amara", "YouTube / Shorts Specialist", "Long-form structure, Shorts cut-downs, titles and descriptions. Presents to camera at the ring light.", "ElevenLabs", ["ElevenLabs voice", "Thumbnail tests"], look(SKIN.f, HAIR.black, "long", "#efd9b4", "#2d3945", { feminine: true }), 9, "meeting"),
      agent("creative-qa", "Tomas", "Creative QA & Compliance", "Checks quality, factual travel claims, rights and consent, platform rules.", "Claude Sonnet", ["Compliance checklist", "Claim checker"], look(SKIN.a, HAIR.grey, "short", "#3f5d4f", "#d9cbb2"), 10, "blocked"),
      agent("publishing-coordinator", "Elena", "Publishing Coordinator", "Hands approved assets to the scheduling and distribution team.", "Claude Haiku", ["Publishing queue", "Calendar"], look(SKIN.c, HAIR.auburn, "bun", "#b9d3d8", "#3b3027", { feminine: true }), 11, "idle"),
    ],
  },
  {
    id: "research-centre",
    name: "Research Centre",
    subtitle: "Destinations & Trends",
    icon: "search",
    status: "planned",
    description: "Destination intelligence, seasonal trends, official travel advisories and sourced storytelling angles.",
    nextUp: "Stand up the destination researcher with cited web research.",
    building: { x: -62, z: -44, elevation: 21, rotation: 0.2, scale: 1, footprint: "round", interior: "research" },
    agents: [
      agent("destination-researcher", "Priya", "Destination Researcher", "Destinations and itineraries, cited from official sources.", "Claude Sonnet", ["Web research", "Citation log"], look(SKIN.d, HAIR.black, "long", "#d7b98a", "#35404d", { feminine: true }), 0),
      agent("accommodation-researcher", "Hugo", "Accommodation Researcher", "Hotels, resorts and stays that fit the member experience.", "Claude Sonnet", ["Web research", "Comparison sheet"], look(SKIN.a, HAIR.brown, "short", "#8fb0c4", "#d8c7a8"), 1),
      agent("experiences-researcher", "Lina", "Experiences & Logistics Researcher", "Events, experiences, transport and local logistics.", "Claude Haiku", ["Web research", "Route planner"], look(SKIN.b, HAIR.auburn, "ponytail", "#e4c9a4", "#39424c", { feminine: true }), 2),
      agent("trend-researcher", "Dev", "Trend & Audience Researcher", "Travel trends and audience insight across channels.", "Claude Sonnet", ["Trend watcher", "Audience insights"], look(SKIN.e, HAIR.black, "short", "#c9d6c1", "#2f3a48"), 3),
    ],
  },
  {
    id: "partnerships-hub",
    name: "Partnerships Hub",
    subtitle: "Brands & Experiences",
    icon: "handshake",
    status: "planned",
    description: "Finds boutique hotels and Airbnbs that would host members for content, prepares outreach and checks every offer.",
    nextUp: "Prospecting list for hosts who trade stays for member content, with human approval before any outreach.",
    building: { x: -112, z: -2, elevation: 14, rotation: -0.2, scale: 1, footprint: "round", interior: "partnerships" },
    agents: [
      agent("hotel-prospector", "Camille", "Hotel & Tourism Prospector", "Boutique hotels and Airbnbs that would host members for content.", "Claude Sonnet", ["Web research", "Prospect list"], look(SKIN.a, HAIR.brown, "bun", "#e6d3bb", "#3c4752", { feminine: true }), 0),
      agent("outreach-preparer", "Andre", "Outreach Preparer", "Prepares supplier outreach drafts and CRM tracking. Sends nothing without approval.", "Claude Sonnet", ["Draft builder", "Partner tracker"], look(SKIN.f, HAIR.black, "short", "#d2a679", "#2c3440"), 1),
      agent("affiliate-researcher", "Mei", "Affiliate Researcher", "Affiliate opportunities and commission research.", "Claude Haiku", ["Web research", "Commission sheet"], look(SKIN.b, HAIR.black, "long", "#a9c7c0", "#4a3728", { feminine: true }), 2),
      agent("offer-verifier", "Omar", "Offer Verifier", "Verifies offers, dates, pricing and terms before they are used.", "Claude Sonnet", ["Offer checklist", "Web research"], look(SKIN.d, HAIR.black, "short", "#f1e6cf", "#39424c"), 3),
    ],
  },
  {
    id: "strategy-growth",
    name: "Strategy & Growth",
    subtitle: "Audience & Revenue",
    icon: "chart",
    status: "planned",
    description: "Dashboards, engagement analysis, tests, campaign reporting, audience insight and recommendations.",
    nextUp: "Feed published post performance back into a weekly growth review.",
    building: { x: 66, z: -72, elevation: 25, rotation: 0.3, scale: 1, footprint: "round", interior: "strategy" },
    agents: [
      agent("growth-analyst", "Nadia", "Growth Analyst", "Engagement analysis and campaign reporting.", "Claude Sonnet", ["Analytics", "Report builder"], look(SKIN.c, HAIR.brown, "long", "#d6c2a0", "#2d3945", { feminine: true }), 0),
      agent("experiment-lead", "Felix", "Experiment Lead", "Plans tests and reads the results.", "Claude Haiku", ["Test planner", "Analytics"], look(SKIN.a, HAIR.blonde, "short", "#7d9aa8", "#e0d2bb"), 1),
      agent("audience-strategist", "Ines", "Audience Strategist", "Audience insight and recommendations for the next cycle.", "Claude Opus", ["Audience insights", "Report builder"], look(SKIN.e, HAIR.black, "curly", "#e7b98a", "#35404d", { feminine: true }), 2),
    ],
  },
  {
    id: "story-lab",
    name: "Story Lab",
    subtitle: "Copy, Campaigns & Storytelling",
    icon: "pen",
    status: "planned",
    description: "Copywriting, creative briefs, editorial calendars, campaign variations, blogs and email sequences.",
    nextUp: "Blog and long-form agent, then editorial calendar planning.",
    building: { x: 88, z: -26, elevation: 16, rotation: -0.1, scale: 1, footprint: "round", interior: "story" },
    agents: [
      agent("campaign-writer", "Theo", "Campaign Writer", "Campaign variations and email sequences.", "Claude Sonnet", ["Voice guide", "Resend drafts"], look(SKIN.b, HAIR.brown, "short", "#c7a77a", "#2f3a48"), 0),
      agent("blog-storyteller", "Aisha", "Blog & Long-Form Storyteller", "SEO blog posts and magazine-style travel stories.", "Claude Opus", ["Voice guide", "Web research"], look(SKIN.f, HAIR.black, "bun", "#efe2cd", "#3f5d4f", { feminine: true }), 1),
      agent("editorial-planner", "Lucas", "Editorial Planner", "Editorial calendar and creative briefs.", "Claude Haiku", ["Calendar", "Brief builder"], look(SKIN.a, HAIR.auburn, "short", "#9db7a8", "#3a3a3a"), 2),
    ],
  },
  {
    id: "publishing-hub",
    name: "Publishing Hub",
    subtitle: "Scheduling & Distribution",
    icon: "calendar",
    status: "planned",
    description: "Queues approved assets, formats per channel, schedules and raises exception alerts.",
    nextUp: "Move the existing bundle.social publishing behind an approval gate shown here.",
    building: { x: 106, z: 20, elevation: 8, rotation: 0.05, scale: 1, footprint: "twin", interior: "publishing" },
    agents: [
      agent("channel-scheduler", "Grace", "Channel Scheduler", "Queues approved assets per channel and time zone.", "Claude Haiku", ["bundle.social", "Calendar"], look(SKIN.d, HAIR.brown, "ponytail", "#d9c8a9", "#2c3440", { feminine: true }), 0),
      agent("distribution-monitor", "Sam", "Distribution Monitor", "Watches publishing results and raises exceptions.", "Claude Haiku", ["bundle.social", "Alerts"], look(SKIN.c, HAIR.black, "short", "#7b8f9d", "#e0d2bb"), 1),
    ],
  },
  {
    id: "client-success",
    name: "Client Success",
    subtitle: "Support & Experience",
    icon: "people",
    status: "planned",
    description: "Onboarding, support, satisfaction monitoring, service tickets, retention and escalation for members.",
    nextUp: "Member support triage with human escalation.",
    building: { x: 164, z: 2, elevation: 5, rotation: -0.1, scale: 1, footprint: "twin", interior: "support" },
    agents: [
      agent("member-support", "Bella", "Member Support", "Account and billing questions, escalated when needed.", "Claude Sonnet", ["Help centre", "Ticket queue"], look(SKIN.b, HAIR.auburn, "long", "#f0dcc0", "#39424c", { feminine: true, headphones: true }), 0),
      agent("onboarding-guide", "Nico", "Onboarding Guide", "Welcome sequences and account setup for new members.", "Claude Haiku", ["Resend drafts", "Member records"], look(SKIN.e, HAIR.black, "short", "#a6c2cf", "#3a3a3a", { headphones: true }), 1),
      agent("retention-lead", "Hana", "Retention Lead", "Engagement scoring and re-engagement campaigns.", "Claude Sonnet", ["Engagement score", "Resend drafts"], look(SKIN.a, HAIR.black, "bun", "#d6e0cf", "#4a3728", { feminine: true, headphones: true }), 2),
    ],
  },
  {
    id: "marketplace",
    name: "Marketplace & E-commerce",
    subtitle: "Showroom & Commerce Ops",
    icon: "bag",
    status: "planned",
    description: "Product and supplier research, listings, merchandising and order workflows. Only approved listings publish.",
    nextUp: "Listing copy and merchandising agents against the existing marketplace catalog.",
    building: { x: -34, z: -158, elevation: 20, rotation: 0.1, scale: 1, footprint: "district", interior: "marketplace" },
    agents: [
      agent("product-researcher", "Ravi", "Product & Category Researcher", "Product and category research.", "Claude Sonnet", ["Web research", "Catalog"], look(SKIN.d, HAIR.black, "short", "#d4b98f", "#2f3a48"), 0),
      agent("supplier-researcher", "Clara", "Vendor & Supplier Researcher", "Vendor research and verified price checks.", "Claude Haiku", ["Web research", "Supplier sheet"], look(SKIN.a, HAIR.brown, "long", "#b8cdd4", "#3b3027", { feminine: true }), 1),
      agent("merchandiser", "Zane", "Listing & Merchandising Writer", "Listing copy, search and merchandising.", "Claude Sonnet", ["Voice guide", "Catalog"], look(SKIN.f, HAIR.black, "short", "#e8cfa5", "#35404d"), 2),
      agent("fulfilment-coordinator", "Yuki", "Fulfilment Coordinator", "Inventory and fulfilment coordination, exceptions to humans.", "Claude Haiku", ["Order queue"], look(SKIN.b, HAIR.black, "ponytail", "#d9a24e", "#2c3440", { feminine: true }), 3),
    ],
  },
  {
    id: "trip-planning",
    name: "Trip Planning & Concierge",
    subtitle: "Itineraries & Traveller Care",
    icon: "globe",
    status: "planned",
    description: "Trip discovery, draft day-by-day itineraries, booking handoffs and traveller concierge support.",
    nextUp: "Draft itinerary agent. Bookings stay human until integrations and safeguards exist.",
    building: { x: 92, z: -128, elevation: 18, rotation: -0.2, scale: 1, footprint: "round", interior: "trip" },
    agents: [
      agent("itinerary-planner", "Marco", "Itinerary Planner", "Destination fit and draft day-by-day itineraries.", "Claude Opus", ["Web research", "Itinerary builder"], look(SKIN.c, HAIR.brown, "short", "#e6d3bb", "#3f5d4f"), 0),
      agent("booking-coordinator", "Tala", "Booking Coordinator", "Quote and booking handoffs, supplier confirmations.", "Claude Haiku", ["Booking handoff sheet"], look(SKIN.e, HAIR.black, "long", "#c7d6d9", "#39424c", { feminine: true }), 1),
      agent("traveller-concierge", "Sana", "Traveller Concierge", "Pre-departure checklists, destination Q&A and post-trip follow-ups.", "Claude Sonnet", ["Help centre", "Trip records"], look(SKIN.d, HAIR.black, "bun", "#f1e6cf", "#2d3945", { feminine: true, headphones: true }), 2),
    ],
  },
  {
    id: "finance",
    name: "Finance",
    subtitle: "Reconciliation & Reporting",
    icon: "coins",
    group: "Internal",
    status: "planned",
    description: "Reconciliation support, invoices, expense categories, commissions, forecasts and exception review.",
    nextUp: "Commission reconciliation reports for human review.",
    building: { x: -150, z: -78, elevation: 13, rotation: 0.4, scale: 1, footprint: "small", interior: "office" },
    agents: [
      agent("earnings-analyst", "Paul", "Earnings & Commission Analyst", "Payout calculations and affiliate commissions, for human review.", "Claude Sonnet", ["Commission ledger"], look(SKIN.a, HAIR.grey, "short", "#7f8f86", "#e0d2bb"), 0),
    ],
  },
  {
    id: "agent-ops",
    name: "Agent Operations",
    subtitle: "Roles, Queues & Routing",
    icon: "cog",
    group: "Internal",
    status: "planned",
    description: "Agent registry, roles, access levels, workload, job queues, model routing and task ownership.",
    nextUp: "Keep this registry in sync with deployed agents.",
    building: { x: -120, z: -112, elevation: 16, rotation: 0.1, scale: 1, footprint: "small", interior: "office" },
    agents: [
      agent("agent-ops-lead", "Vera", "Agent Operations Lead", "Roles, access levels, workload and model routing.", "Claude Sonnet", ["Agent registry", "Queue monitor"], look(SKIN.c, HAIR.black, "bun", "#d7c9b0", "#35404d", { feminine: true }), 0),
    ],
  },
  {
    id: "legal-compliance",
    name: "Legal & Compliance",
    subtitle: "Rights, Consent & Terms",
    icon: "scale",
    group: "Internal",
    status: "planned",
    description: "Document checks, rights and consent, travel content licensing, supplier terms, privacy and audit.",
    nextUp: "Rights and consent checklist shared with Creative QA.",
    building: { x: -124, z: -72, elevation: 13, rotation: -0.2, scale: 1, footprint: "small", interior: "office" },
    agents: [
      agent("compliance-reviewer", "Iris", "Compliance Reviewer", "Rights, consent and supplier terms review, with human sign-off.", "Claude Opus", ["Compliance checklist"], look(SKIN.e, HAIR.black, "long", "#cdbfa8", "#2c3440", { feminine: true }), 0),
    ],
  },
  {
    id: "it-integrations",
    name: "IT & Integrations",
    subtitle: "Build & Reliability",
    icon: "plug",
    group: "Internal",
    status: "live",
    description: "Builds and maintains the Monetura platform today. Connector health, deployments and reliability live here.",
    nextUp: "Report real build and deployment events into this feed.",
    building: { x: -178, z: -92, elevation: 11, rotation: 0.6, scale: 1, footprint: "small", interior: "office" },
    agents: [
      agent("platform-builder", "Claude Code", "Platform Builder", "Builds the Monetura platform, HQ included.", "Claude Opus", ["Claude Code", "GitHub", "Vercel"], look(SKIN.b, HAIR.brown, "short", "#c17a4a", "#2f3a48"), 0, "working"),
      agent("reliability-monitor", "Ash", "Reliability Monitor", "Connector health, failures, retries and incident alerts.", "Claude Haiku", ["Uptime checks", "Event log"], look(SKIN.d, HAIR.black, "short", "#68808f", "#d8c7a8"), 1, "working"),
    ],
  },
  {
    id: "business-intelligence",
    name: "Business Intelligence",
    subtitle: "Executive Reporting",
    icon: "pie",
    group: "Internal",
    status: "planned",
    description: "Executive reporting across content, travel, commerce, operating costs and service quality.",
    nextUp: "One weekly executive summary from the platform's own data.",
    building: { x: -148, z: -128, elevation: 15, rotation: 0.3, scale: 1, footprint: "small", interior: "office" },
    agents: [
      agent("bi-analyst", "Oskar", "BI Analyst", "Weekly executive reporting across departments.", "Claude Sonnet", ["Analytics", "Report builder"], look(SKIN.a, HAIR.brown, "short", "#a8a08f", "#3a3a3a"), 0),
    ],
  },
];

export function findDivision(id: string): RegistryDivision | undefined {
  return DIVISIONS.find((d) => d.id === id);
}

export function findAgent(id: string): { agent: RegistryAgent; division: RegistryDivision } | undefined {
  for (const division of DIVISIONS) {
    const found = division.agents.find((a) => a.id === id);
    if (found) return { agent: found, division };
  }
  return undefined;
}
