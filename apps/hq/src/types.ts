/** Shared HQ types. Safe for client and server: contains no data. */

export type DivisionStatus = "live" | "building" | "planned";
export type AgentStatus = "working" | "meeting" | "idle" | "blocked" | "offline";
export type FootprintType = "round" | "twin" | "tiered" | "angular" | "district" | "small";

export type InteriorKind =
  | "command"
  | "studio"
  | "research"
  | "partnerships"
  | "story"
  | "publishing"
  | "strategy"
  | "support"
  | "marketplace"
  | "trip"
  | "web"
  | "visual"
  | "office";

export type IconName =
  | "palm" | "play" | "search" | "handshake" | "pen" | "calendar" | "chart" | "people"
  | "bag" | "globe" | "coins" | "cog" | "scale" | "plug" | "pie" | "m" | "bell" | "lock"
  | "film" | "image" | "doc" | "check" | "megaphone" | "x" | "arrow" | "pause" | "next" | "prev"
  | "team" | "projects" | "island" | "grid" | "info" | "settings";

export interface BuildingConfig {
  /** World position on the island. The terrain flattens to `elevation` here. */
  x: number;
  z: number;
  elevation: number;
  rotation: number;
  scale: number;
  footprint: FootprintType;
  interior: InteriorKind;
}

export interface CharacterAppearance {
  skin: string;
  hair: string;
  hairStyle: "short" | "bun" | "long" | "curly" | "bald" | "ponytail";
  top: string;
  /** Optional printed fabric: a tropical shirt pattern colour. */
  print?: string;
  bottom: string;
  shoes: string;
  headphones?: boolean;
  feminine?: boolean;
}

/** Agent as the server sends it. Optional fields are stripped in the public projection. */
export interface ClientAgent {
  id: string;
  role: string;
  name?: string;
  specialty?: string;
  model?: string;
  tools?: string[];
  status: AgentStatus;
  appearance: CharacterAppearance;
  homeDesk: number;
}

export interface ClientDivision {
  id: string;
  name: string;
  subtitle: string;
  icon: IconName;
  building: BuildingConfig;
  status: DivisionStatus;
  description: string;
  nextUp?: string;
  group?: string;
  /** How many of `agents` are on the floor (from status). */
  staffed: number;
  agents: ClientAgent[];
}

export type HqMode = "owner" | "public";

export interface WorldData {
  mode: HqMode;
  orchestratorName: string;
  divisions: ClientDivision[];
  counters: CounterConfig[];
  divisionStats: Record<string, DivisionStatConfig[]>;
  tour: TourStep[];
}

export interface CounterConfig {
  id: string;
  label: string;
  icon: IconName;
  /** Division ids whose distinct tasks feed this counter. */
  divisions: string[];
  /** Added to demo counts only, so the demo reads like a running business. */
  demoBaseline: number;
}

export interface DivisionStatConfig {
  id: string;
  label: string;
  icon: IconName;
  /** Real values count distinct tasks with this event type in the division. */
  match: "task_started" | "progress" | "completed";
  demoBaseline: number;
}

export interface TourStep {
  id: string;
  /** Division to fly to. null flies to the island overview. */
  divisionId: string | null;
  roofOff: boolean;
  stage: string;
  caption: string;
  durationSec: number;
  /** The content packet travels this hop during the step. */
  packet?: { from: string; to: string };
}

export type HqEventType =
  | "task_started" | "progress" | "handoff" | "needs_approval"
  | "approved" | "rejected" | "completed" | "blocked";

/** Owner-mode event row sent to the browser. */
export interface OwnerEvent {
  id: number;
  createdAt: string;
  agentId: string | null;
  divisionId: string;
  taskId: string | null;
  taskTitle: string | null;
  eventType: HqEventType;
  status: string | null;
  progress: number | null;
  fromDivisionId: string | null;
  toDivisionId: string | null;
  summary: string | null;
  isDemo: boolean;
}

export interface PendingApproval {
  eventId: number;
  agentId: string | null;
  divisionId: string;
  taskTitle: string;
  summary: string | null;
  createdAt: string;
  isDemo: boolean;
}

export interface AgentState {
  agentId: string;
  status: AgentStatus;
  taskId: string | null;
  taskTitle: string | null;
  progress: number | null;
  stage: string | null;
  blocker: string | null;
  recentOutputs: string[];
  isDemo: boolean;
  updatedAt: string | null;
}

export interface CounterValue {
  id: string;
  value: number;
  isDemo: boolean;
}

export interface RouteActivity {
  from: string;
  to: string;
  count: number;
  isDemo: boolean;
}

export interface OwnerFeed {
  mode: "owner";
  source: "database" | "memory";
  serverTime: string;
  events: OwnerEvent[];
  agents: Record<string, AgentState>;
  counters: CounterValue[];
  divisionStats: Record<string, CounterValue[]>;
  pendingApprovals: PendingApproval[];
}

/** The only thing the public tour ever receives. Aggregates, no identifiers. */
export interface PublicFeed {
  mode: "public";
  serverTime: string;
  counters: CounterValue[];
  divisionStats: Record<string, CounterValue[]>;
  divisionActivity: Record<string, number>;
  routes: RouteActivity[];
}

export type Feed = OwnerFeed | PublicFeed;
