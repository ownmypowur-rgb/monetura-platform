import "server-only";
import { desc, eq, and, lt, gte, inArray, count } from "drizzle-orm";
import { getDb, moneturaHqApprovals, moneturaHqEvents } from "@monetura/db";
import { nextDemoEvents, type EventRow, type NewEvent } from "./demo";

const READ_LIMIT = 800;
/** Real rows are fetched separately so a busy demo generator can never push them out of the window. */
const REAL_READ_LIMIT = 300;
const DEMO_TICK_MS = 5_000;
const DEMO_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;

export function dbConfigured(): boolean {
  return Boolean(process.env["DATABASE_URL"]);
}

function demoEnabled(): boolean {
  return process.env["HQ_DEMO_MODE"] !== "off";
}

function toRow(r: typeof moneturaHqEvents.$inferSelect): EventRow {
  return {
    id: r.id,
    createdAt: r.createdAt,
    agentId: r.agentId,
    divisionId: r.divisionId,
    taskId: r.taskId,
    taskTitle: r.taskTitle,
    eventType: r.eventType,
    status: r.status,
    progress: r.progress,
    fromDivisionId: r.fromDivisionId,
    toDivisionId: r.toDivisionId,
    payloadJson: r.payloadJson,
    publicSafe: r.publicSafe,
    isDemo: r.isDemo,
  };
}

/* ---------- In-memory fallback, used only when DATABASE_URL is not set ---------- */

interface MemoryState {
  rows: EventRow[];
  decided: Set<number>;
  nextId: number;
}
const memoryHolder = globalThis as unknown as { __hqMemory?: MemoryState };
function memory(): MemoryState {
  if (!memoryHolder.__hqMemory) {
    memoryHolder.__hqMemory = { rows: [], decided: new Set(), nextId: 1 };
    for (let i = 0; i < 60; i++) memoryAppend(nextDemoEvents(memoryHolder.__hqMemory.rows));
  }
  return memoryHolder.__hqMemory;
}
function memoryAppend(events: NewEvent[]): number[] {
  const state = memoryHolder.__hqMemory as MemoryState;
  const ids: number[] = [];
  for (const e of events) {
    const id = state.nextId++;
    state.rows.push({ ...e, id, createdAt: e.createdAt ?? new Date() });
    ids.push(id);
  }
  const real = state.rows.filter((r) => !r.isDemo).slice(-REAL_READ_LIMIT);
  const demo = state.rows.filter((r) => r.isDemo).slice(-READ_LIMIT);
  state.rows = [...real, ...demo].sort((a, b) => a.id - b.id);
  return ids;
}

/* ---------- Reads ---------- */

export async function readOwnerRows(): Promise<{ rows: EventRow[]; decided: Set<number> }> {
  if (!dbConfigured()) {
    const state = memory();
    return { rows: state.rows, decided: state.decided };
  }
  const db = getDb();
  const [recent, real] = await Promise.all([
    db.select().from(moneturaHqEvents).orderBy(desc(moneturaHqEvents.id)).limit(READ_LIMIT),
    db
      .select()
      .from(moneturaHqEvents)
      .where(eq(moneturaHqEvents.isDemo, false))
      .orderBy(desc(moneturaHqEvents.id))
      .limit(REAL_READ_LIMIT),
  ]);
  const byId = new Map<number, (typeof recent)[number]>();
  for (const r of [...recent, ...real]) byId.set(r.id, r);
  const rows = [...byId.values()].sort((a, b) => b.id - a.id);
  const approvalEventIds = rows.filter((r) => r.eventType === "needs_approval").map((r) => r.id);
  const decided =
    approvalEventIds.length === 0
      ? []
      : await db
          .select({ eventId: moneturaHqApprovals.eventId })
          .from(moneturaHqApprovals)
          .where(inArray(moneturaHqApprovals.eventId, approvalEventIds));
  return { rows: rows.map(toRow), decided: new Set(decided.map((d) => d.eventId)) };
}

/** Server-side public filter. Rows that aren't public_safe never leave the database. */
export async function readPublicRows(): Promise<EventRow[]> {
  if (!dbConfigured()) return memory().rows.filter((r) => r.publicSafe);
  const rows = await getDb()
    .select()
    .from(moneturaHqEvents)
    .where(eq(moneturaHqEvents.publicSafe, true))
    .orderBy(desc(moneturaHqEvents.id))
    .limit(READ_LIMIT);
  return rows.map(toRow);
}

/* ---------- Real events (authenticated ingest) ---------- */

export async function insertRealEvent(event: NewEvent): Promise<{ id: number; persisted: boolean }> {
  const row: NewEvent = { ...event, isDemo: false };
  if (!dbConfigured()) {
    memory();
    const [id] = memoryAppend([row]);
    return { id: id ?? 0, persisted: false };
  }
  const result = await getDb().insert(moneturaHqEvents).values(toInsert(row));
  return { id: result[0].insertId, persisted: true };
}

/** Real events created in the last `windowMs`, across every server instance. */
export async function countRecentRealEvents(windowMs: number): Promise<number> {
  const since = new Date(Date.now() - windowMs);
  if (!dbConfigured()) {
    return memory().rows.filter((r) => !r.isDemo && r.createdAt >= since).length;
  }
  const rows = await getDb()
    .select({ n: count() })
    .from(moneturaHqEvents)
    .where(and(eq(moneturaHqEvents.isDemo, false), gte(moneturaHqEvents.createdAt, since)));
  return rows[0]?.n ?? 0;
}

/* ---------- Demo ticking: only from authenticated owner polling ---------- */

export async function tickDemo(rows: readonly EventRow[]): Promise<void> {
  if (!demoEnabled()) return;
  const latest = rows.reduce<number>((max, r) => Math.max(max, r.createdAt.getTime()), 0);
  if (Date.now() - latest < DEMO_TICK_MS) return;
  const events = nextDemoEvents(rows);
  if (events.length === 0) return;

  if (!dbConfigured()) {
    memoryAppend(events);
    return;
  }
  const db = getDb();
  await db.insert(moneturaHqEvents).values(events.map(toInsert));
  if (Math.random() < 0.01) {
    await db
      .delete(moneturaHqEvents)
      .where(
        and(
          eq(moneturaHqEvents.isDemo, true),
          lt(moneturaHqEvents.createdAt, new Date(Date.now() - DEMO_RETENTION_MS)),
        ),
      );
  }
}

function toInsert(e: NewEvent): typeof moneturaHqEvents.$inferInsert {
  return {
    agentId: e.agentId,
    divisionId: e.divisionId,
    taskId: e.taskId,
    taskTitle: e.taskTitle,
    eventType: e.eventType,
    status: e.status,
    progress: e.progress,
    fromDivisionId: e.fromDivisionId,
    toDivisionId: e.toDivisionId,
    payloadJson: e.payloadJson ?? null,
    publicSafe: e.publicSafe,
    isDemo: e.isDemo,
    ...(e.createdAt ? { createdAt: e.createdAt } : {}),
  };
}

/* ---------- Approvals ---------- */

export type ApprovalResult =
  | { ok: true; approvalId: number; eventId: number; persisted: boolean }
  | { ok: false; status: number; error: string };

export async function recordApproval(input: {
  eventId: number;
  decision: "approved" | "rejected";
  decidedBy: string;
  note: string | null;
}): Promise<ApprovalResult> {
  if (!dbConfigured()) {
    const state = memory();
    const row = state.rows.find((r) => r.id === input.eventId);
    if (!row || row.eventType !== "needs_approval") return { ok: false, status: 404, error: "Not an open approval" };
    if (state.decided.has(row.id)) return { ok: false, status: 409, error: "Already decided" };
    state.decided.add(row.id);
    const [id] = memoryAppend([decisionEvent(row, input.decision, input.note)]);
    return { ok: true, approvalId: 0, eventId: id ?? 0, persisted: false };
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(moneturaHqEvents)
    .where(eq(moneturaHqEvents.id, input.eventId))
    .limit(1);
  const source = rows[0];
  if (!source || source.eventType !== "needs_approval") {
    return { ok: false, status: 404, error: "Not an open approval" };
  }
  const prior = await db
    .select({ id: moneturaHqApprovals.id })
    .from(moneturaHqApprovals)
    .where(eq(moneturaHqApprovals.eventId, input.eventId))
    .limit(1);
  if (prior.length > 0) return { ok: false, status: 409, error: "Already decided" };

  const approvalResult = await db.insert(moneturaHqApprovals).values({
    eventId: source.id,
    agentId: source.agentId,
    decision: input.decision,
    decidedBy: input.decidedBy,
    note: input.note,
  });
  const eventResult = await db
    .insert(moneturaHqEvents)
    .values(toInsert(decisionEvent(toRow(source), input.decision, input.note)));

  // TODO(hq-downstream): the island only records the decision today. Trigger the
  // real downstream action (publish, send) from here once those workflows exist
  // behind approval gates. See HQ-DECISIONS.md, "Approvals downstream stub".
  console.info(`[hq] approval recorded for event ${source.id}: ${input.decision} (downstream action stubbed)`);

  return {
    ok: true,
    approvalId: approvalResult[0].insertId,
    eventId: eventResult[0].insertId,
    persisted: true,
  };
}

function decisionEvent(source: EventRow, decision: "approved" | "rejected", note: string | null): NewEvent {
  return {
    agentId: source.agentId,
    divisionId: source.divisionId,
    taskId: source.taskId,
    taskTitle: source.taskTitle,
    eventType: decision,
    status: decision === "approved" ? "working" : "working",
    progress: source.progress,
    fromDivisionId: null,
    toDivisionId: null,
    payloadJson: { stage: "Review & approval", summary: note ?? `Owner ${decision} this.` },
    publicSafe: false,
    isDemo: source.isDemo,
  };
}
