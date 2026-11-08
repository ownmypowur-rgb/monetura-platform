import type { CounterConfig, DivisionStatConfig } from "../types";

/** Live Operations panel. Editable without touching 3D code. */
export const COUNTERS: CounterConfig[] = [
  { id: "content-projects", label: "Content Projects", icon: "projects", divisions: ["content-studio"], demoBaseline: 112 },
  { id: "destinations", label: "Destinations Researched", icon: "globe", divisions: ["research-centre"], demoBaseline: 36 },
  { id: "campaigns", label: "Campaigns Active", icon: "megaphone", divisions: ["story-lab", "publishing-hub"], demoBaseline: 24 },
  { id: "partnerships", label: "Partnership Opportunities", icon: "handshake", divisions: ["partnerships-hub"], demoBaseline: 18 },
  { id: "deliverables", label: "Deliverables", icon: "check", divisions: ["content-studio", "publishing-hub"], demoBaseline: 142 },
];

const generic = (a: string, b: string, c: string): DivisionStatConfig[] => [
  { id: "open", label: a, icon: "projects", match: "task_started", demoBaseline: 6 },
  { id: "active", label: b, icon: "doc", match: "progress", demoBaseline: 4 },
  { id: "done", label: c, icon: "check", match: "completed", demoBaseline: 11 },
];

/** Stats strip above the department bar, per division. */
export const DIVISION_STATS: Record<string, DivisionStatConfig[]> = {
  "atlas-command": generic("Open Workflows", "Handoffs Today", "Approvals Routed"),
  "content-studio": [
    { id: "production", label: "Projects in Production", icon: "chart", match: "task_started", demoBaseline: 28 },
    { id: "videos", label: "Videos Editing", icon: "film", match: "progress", demoBaseline: 9 },
    { id: "photos", label: "Photo Sets Enhancing", icon: "image", match: "progress", demoBaseline: 14 },
    { id: "captions", label: "Captions & Copy", icon: "doc", match: "progress", demoBaseline: 7 },
    { id: "deliveries", label: "Deliveries This Week", icon: "check", match: "completed", demoBaseline: 20 },
  ],
  "website-seo": generic("Pages in Review", "Briefs Drafting", "Pages Updated"),
  "visual-studio": generic("Prompts in Review", "Clips Rendering", "Assets Approved"),
  "research-centre": generic("Destinations in Queue", "Briefs Drafting", "Sources Verified"),
  "partnerships-hub": generic("Prospects", "Outreach Prepared", "Offers Verified"),
  "story-lab": generic("Briefs Open", "Scripts Drafting", "Stories Approved"),
  "publishing-hub": generic("Queued Posts", "Channels Scheduled", "Published This Week"),
  "strategy-growth": generic("Tests Running", "Reports Drafting", "Insights Shared"),
  "client-success": generic("Open Requests", "Onboardings", "Resolved This Week"),
  marketplace: generic("Listings in Review", "Supplier Checks", "Listings Approved"),
  "trip-planning": generic("Trip Enquiries", "Itineraries Drafting", "Plans Approved"),
  finance: generic("Items to Reconcile", "Reports Drafting", "Closed This Week"),
  "agent-ops": generic("Agents Registered", "Queues Watched", "Routing Changes"),
  "legal-compliance": generic("Documents in Review", "Consent Checks", "Cleared This Week"),
  "it-integrations": generic("Connectors Watched", "Builds in Progress", "Releases This Week"),
  "business-intelligence": generic("Dashboards", "Reports Drafting", "Reviews Delivered"),
};
