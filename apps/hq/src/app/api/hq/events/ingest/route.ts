import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@monetura/db";
import { DIVISIONS } from "@/registry";
import { countRecentRealEvents, insertRealEvent } from "@/server/store";
import type { AgentStatus } from "@/types";

/**
 * Authenticated ingest for real agent activity (Atlas first). Writes is_demo = false
 * rows to monetura_hq_events. Bearer token must match HQ_INGEST_TOKEN; if the env var
 * is unset or too short, every request is refused.
 *
 * Node runtime: uses the database (mysql2 cannot run on Edge).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_TOKEN_LENGTH = 32;
const PER_IP_LIMIT = 30; // per minute, per warm instance
const GLOBAL_LIMIT = 60; // real events per minute across all instances (database count)
const MAX_PAYLOAD_CHARS = 2_000;
const MAX_BODY_CHARS = 8_000;

const DIVISION_IDS = new Set(DIVISIONS.map((d) => d.id));
const AGENT_IDS = new Set(DIVISIONS.flatMap((d) => d.agents.map((a) => a.id)));

const divisionId = z.string().refine((id) => DIVISION_IDS.has(id), "Unknown division");

const bodySchema = z
  .object({
    agentId: z.string().refine((id) => AGENT_IDS.has(id), "Unknown agent"),
    divisionId,
    taskId: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9._:-]+$/, "taskId: letters, digits, . _ : - only"),
    taskTitle: z.string().trim().min(1).max(255),
    eventType: z.enum(["task_started", "progress", "handoff", "needs_approval", "completed", "blocked"]),
    status: z.enum(["working", "meeting", "idle", "blocked", "offline"]).optional(),
    progress: z.number().int().min(0).max(100),
    fromDivisionId: divisionId.optional(),
    toDivisionId: divisionId.optional(),
    payload: z
      .record(z.unknown())
      .optional()
      .refine((p) => p === undefined || JSON.stringify(p).length <= MAX_PAYLOAD_CHARS, "payload too large"),
    publicSafe: z.boolean().default(false),
  })
  .strict()
  .refine((b) => b.eventType !== "handoff" || (b.fromDivisionId && b.toDivisionId), {
    message: "handoff needs fromDivisionId and toDivisionId",
  })
  .refine(
    (b) => {
      const division = DIVISIONS.find((d) => d.id === b.divisionId);
      return division?.agents.some((a) => a.id === b.agentId) ?? false;
    },
    { message: "agentId does not belong to divisionId" },
  );

function defaultStatus(eventType: z.infer<typeof bodySchema>["eventType"]): AgentStatus {
  if (eventType === "completed") return "idle";
  if (eventType === "blocked") return "blocked";
  if (eventType === "needs_approval") return "meeting";
  return "working";
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/** Constant-time comparison. Hashing first makes the lengths equal. */
function tokenMatches(presented: string, expected: string): boolean {
  return timingSafeEqual(digest(presented), digest(expected));
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "unknown";
}

export async function POST(req: NextRequest) {
  const expected = process.env["HQ_INGEST_TOKEN"];
  if (!expected || expected.length < MIN_TOKEN_LENGTH) {
    return NextResponse.json({ error: "Ingest disabled" }, { status: 503 });
  }

  const ipLimit = checkRateLimit(`hq-ingest:${clientIp(req)}`, PER_IP_LIMIT, 60_000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } },
    );
  }

  const header = req.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!presented || !tokenMatches(presented, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.text().catch(() => "");
  if (raw.length > MAX_BODY_CHARS) {
    return NextResponse.json({ error: "Body too large" }, { status: 413 });
  }
  let json: unknown = null;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid event", issues: parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`) },
      { status: 400 },
    );
  }

  try {
    if ((await countRecentRealEvents(60_000)) >= GLOBAL_LIMIT) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
    }
    const b = parsed.data;
    const result = await insertRealEvent({
      agentId: b.agentId,
      divisionId: b.divisionId,
      taskId: b.taskId,
      taskTitle: b.taskTitle,
      eventType: b.eventType,
      status: b.status ?? defaultStatus(b.eventType),
      progress: b.progress,
      fromDivisionId: b.fromDivisionId ?? null,
      toDivisionId: b.toDivisionId ?? null,
      payloadJson: b.payload ?? null,
      publicSafe: b.publicSafe,
      isDemo: false,
    });
    return NextResponse.json({ ok: true, eventId: result.id, persisted: result.persisted }, { status: 201 });
  } catch (err) {
    console.error("[hq] ingest failed", err);
    return NextResponse.json({ error: "Event could not be recorded" }, { status: 503 });
  }
}
