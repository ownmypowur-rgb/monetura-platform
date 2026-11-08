import { COUNTERS, DIVISION_STATS } from "../config/counters";
import { DIVISIONS } from "../registry";
import type {
  AgentState,
  AgentStatus,
  CounterValue,
  OwnerEvent,
  OwnerFeed,
  PendingApproval,
  PublicFeed,
  RouteActivity,
} from "../types";
import type { EventRow } from "./demo";

const AGENT_STATUSES: readonly AgentStatus[] = ["working", "meeting", "idle", "blocked", "offline"];

function payloadString(payload: unknown, key: string): string | null {
  if (payload && typeof payload === "object" && key in payload) {
    const value = (payload as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
  }
  return null;
}

function distinctTasks(rows: readonly EventRow[], match: (r: EventRow) => boolean): number {
  const ids = new Set<string>();
  for (const r of rows) if (r.taskId && match(r)) ids.add(r.taskId);
  return ids.size;
}

/** Real rows win. Demo values are baseline + demo activity, and always flagged. */
function resolve(real: number, demo: number, baseline: number): { value: number; isDemo: boolean } {
  return real > 0 ? { value: real, isDemo: false } : { value: baseline + demo, isDemo: true };
}

function counters(rows: readonly EventRow[]): CounterValue[] {
  return COUNTERS.map((c) => {
    const inScope = (r: EventRow) => c.divisions.includes(r.divisionId);
    const real = distinctTasks(rows, (r) => inScope(r) && !r.isDemo);
    const demo = distinctTasks(rows, (r) => inScope(r) && r.isDemo);
    return { id: c.id, ...resolve(real, demo, c.demoBaseline) };
  });
}

function divisionStats(rows: readonly EventRow[]): Record<string, CounterValue[]> {
  const out: Record<string, CounterValue[]> = {};
  for (const [divisionId, stats] of Object.entries(DIVISION_STATS)) {
    out[divisionId] = stats.map((s) => {
      const inScope = (r: EventRow) => r.divisionId === divisionId && r.eventType === s.match;
      const real = distinctTasks(rows, (r) => inScope(r) && !r.isDemo);
      const demo = distinctTasks(rows, (r) => inScope(r) && r.isDemo);
      return { id: s.id, ...resolve(real, Math.min(demo, 9), s.demoBaseline) };
    });
  }
  return out;
}

function agentStates(rows: readonly EventRow[]): Record<string, AgentState> {
  const states: Record<string, AgentState> = {};
  for (const division of DIVISIONS) {
    for (const a of division.agents) {
      states[a.id] = {
        agentId: a.id,
        status: a.status,
        taskId: null,
        taskTitle: null,
        progress: null,
        stage: null,
        blocker: null,
        recentOutputs: [],
        isDemo: true,
        updatedAt: null,
      };
    }
  }
  // Real events take priority: once an agent has any real row, or its division is
  // live, demo rows no longer drive its state. "Live" therefore only ever comes
  // from real rows, and a live division never shows staged activity.
  const liveDivisions = new Set(DIVISIONS.filter((d) => d.status === "live").map((d) => d.id));
  const agentsWithReal = new Set(rows.filter((r) => !r.isDemo && r.agentId).map((r) => r.agentId));
  const ascending = [...rows].sort((a, b) => a.id - b.id);
  for (const r of ascending) {
    if (!r.agentId) continue;
    if (r.isDemo && (agentsWithReal.has(r.agentId) || liveDivisions.has(r.divisionId))) continue;
    const s = states[r.agentId];
    if (!s) continue;
    const status = AGENT_STATUSES.find((x) => x === r.status);
    if (status) s.status = status;
    s.taskId = r.taskId;
    s.taskTitle = r.taskTitle;
    s.progress = r.progress;
    s.stage = payloadString(r.payloadJson, "stage") ?? s.stage;
    s.blocker = r.eventType === "blocked" ? payloadString(r.payloadJson, "blocker") : null;
    s.isDemo = r.isDemo;
    s.updatedAt = r.createdAt.toISOString();
    if (r.eventType === "completed") {
      const output = payloadString(r.payloadJson, "output");
      if (output) s.recentOutputs = [output, ...s.recentOutputs.filter((o) => o !== output)].slice(0, 5);
      s.taskId = null;
      s.taskTitle = null;
      s.progress = null;
    }
  }
  return states;
}

export function toOwnerFeed(
  rows: readonly EventRow[],
  decidedEventIds: ReadonlySet<number>,
  source: OwnerFeed["source"],
): OwnerFeed {
  const events: OwnerEvent[] = [...rows]
    .sort((a, b) => b.id - a.id)
    .slice(0, 80)
    .map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      agentId: r.agentId,
      divisionId: r.divisionId,
      taskId: r.taskId,
      taskTitle: r.taskTitle,
      eventType: r.eventType,
      status: r.status,
      progress: r.progress,
      fromDivisionId: r.fromDivisionId,
      toDivisionId: r.toDivisionId,
      summary: payloadString(r.payloadJson, "summary"),
      isDemo: r.isDemo,
    }));
  const pendingApprovals: PendingApproval[] = rows
    .filter((r) => r.eventType === "needs_approval" && !decidedEventIds.has(r.id))
    .sort((a, b) => b.id - a.id)
    .map((r) => ({
      eventId: r.id,
      agentId: r.agentId,
      divisionId: r.divisionId,
      taskTitle: r.taskTitle ?? "Untitled task",
      summary: payloadString(r.payloadJson, "summary"),
      createdAt: r.createdAt.toISOString(),
      isDemo: r.isDemo,
    }));
  return {
    mode: "owner",
    source,
    serverTime: new Date().toISOString(),
    events,
    agents: agentStates(rows),
    counters: counters(rows),
    divisionStats: divisionStats(rows),
    pendingApprovals,
  };
}

/**
 * Public projection. Input must already be filtered to public_safe rows. Output is
 * built field by field from aggregates: no task titles, ids, agents or payloads.
 */
export function toPublicFeed(publicRows: readonly EventRow[]): PublicFeed {
  const divisionActivity: Record<string, number> = {};
  const routes = new Map<string, RouteActivity>();
  for (const r of publicRows) {
    divisionActivity[r.divisionId] = (divisionActivity[r.divisionId] ?? 0) + 1;
    if (r.eventType === "handoff" && r.fromDivisionId && r.toDivisionId) {
      const key = `${r.fromDivisionId}>${r.toDivisionId}`;
      const route = routes.get(key);
      if (route) route.count += 1;
      else routes.set(key, { from: r.fromDivisionId, to: r.toDivisionId, count: 1, isDemo: r.isDemo });
    }
  }
  return {
    mode: "public",
    serverTime: new Date().toISOString(),
    counters: counters(publicRows),
    divisionStats: divisionStats(publicRows),
    divisionActivity,
    routes: [...routes.values()],
  };
}
