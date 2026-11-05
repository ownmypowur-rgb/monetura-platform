/**
 * Demo generator. Pure logic: given recent rows, produce the next is_demo events.
 * Used by the owner feed (one tick when the latest event is stale), by the
 * in-memory fallback, and by scripts/seed-demo.ts.
 *
 * Nothing here touches real systems. Every row it creates has isDemo = true.
 */
import { ORCHESTRATOR_NAME } from "../config/brand";
import { DIVISIONS } from "../registry";
import { staffedAgents } from "./projection";
import type { HqEventType } from "../types";

export interface EventRow {
  id: number;
  createdAt: Date;
  agentId: string | null;
  divisionId: string;
  taskId: string | null;
  taskTitle: string | null;
  eventType: HqEventType;
  status: string | null;
  progress: number | null;
  fromDivisionId: string | null;
  toDivisionId: string | null;
  payloadJson: unknown;
  publicSafe: boolean;
  isDemo: boolean;
}

export type NewEvent = Omit<EventRow, "id" | "createdAt"> & { createdAt?: Date };

interface Template {
  title: string;
  stage: string;
  output: string;
  needsApproval?: boolean;
  /** Division the finished work is handed to; a pulse runs along the paths. */
  handoffTo?: string;
}

const TASKS: Record<string, Template[]> = {
  "video-editor": [
    { title: "Thailand Vlog: main edit", stage: "Production", output: "Thailand Vlog, 9:16 cut v3", handoffTo: "publishing-hub", needsApproval: true },
    { title: "Lisbon Reel: subtitle pass", stage: "Production", output: "Lisbon Reel, subtitled master" },
  ],
  "photo-specialist": [
    { title: "Bali Set: enhance and curate", stage: "Production", output: "Bali Set, 42 selects" },
    { title: "Costa Rica Set: colour pass", stage: "Production", output: "Costa Rica Set, graded" },
  ],
  designer: [
    { title: "Tulum Carousel: 8 slides", stage: "Production", output: "Tulum Carousel, final", needsApproval: true },
    { title: "Santorini thumbnails", stage: "Production", output: "Santorini thumbnails, 3 variants" },
  ],
  copywriter: [
    { title: "Thailand Reel captions", stage: "Production", output: "Thailand captions, 5 variants", handoffTo: "story-lab" },
    { title: "Bali story hooks", stage: "Production", output: "Bali hooks, 12 options" },
  ],
  "media-librarian": [
    { title: "Intake: Thailand trip upload", stage: "Intake", output: "Thailand upload, 214 files tagged", handoffTo: "research-centre" },
    { title: "Intake: Portugal trip upload", stage: "Intake", output: "Portugal upload, 96 files tagged" },
  ],
  "creative-director": [
    { title: "Review final edits: Thailand Vlog", stage: "Review & approval", output: "Thailand Vlog, notes returned", needsApproval: true },
  ],
  "facebook-specialist": [{ title: "Facebook variants: Bali story", stage: "Production", output: "Bali Facebook post, draft" }],
  "instagram-specialist": [{ title: "Instagram carousel plan: Tulum", stage: "Production", output: "Tulum Instagram plan" }],
  "tiktok-specialist": [{ title: "TikTok hooks: Thailand", stage: "Production", output: "Thailand TikTok hooks" }],
  "youtube-specialist": [{ title: "Shorts cut-downs: Lisbon", stage: "Production", output: "Lisbon Shorts, 4 cuts" }],
  "creative-qa": [{ title: "Rights check: Tulum Carousel", stage: "Review & approval", output: "Tulum rights check passed", needsApproval: true }],
  "publishing-coordinator": [
    { title: "Schedule brief: Thailand week", stage: "Publishing", output: "Thailand schedule brief", handoffTo: "publishing-hub", needsApproval: true },
  ],
  atlas: [{ title: "Route new trip upload", stage: "Intake", output: "Workflow opened", handoffTo: "content-studio" }],
  "atlas-ops": [{ title: "Queue check across departments", stage: "Operations", output: "Queue report" }],
  "platform-builder": [{ title: "HQ platform release", stage: "Build", output: "HQ release notes" }],
  "reliability-monitor": [{ title: "Connector health sweep", stage: "Operations", output: "Connector health report", handoffTo: "atlas-command" }],
};

const BLOCKERS = [
  "Waiting on music licence confirmation",
  "Missing consent form for two photos",
  "Source footage below 1080p",
];

function pick<T>(items: readonly T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length) % items.length] as T;
}

function demoEvent(partial: Partial<NewEvent> & Pick<NewEvent, "divisionId" | "eventType">): NewEvent {
  return {
    agentId: null,
    taskId: null,
    taskTitle: null,
    status: null,
    progress: null,
    fromDivisionId: null,
    toDivisionId: null,
    payloadJson: null,
    publicSafe: true,
    ...partial,
    isDemo: true,
  };
}

function templateFor(agentId: string, title: string | null): Template | undefined {
  return TASKS[agentId]?.find((t) => t.title === title);
}

/** Next events given recent rows (any order). Returns one or two events. */
export function nextDemoEvents(recent: readonly EventRow[], rand: () => number = Math.random): NewEvent[] {
  const ordered = [...recent].filter((r) => r.isDemo).sort((a, b) => a.id - b.id);
  const latestByTask = new Map<string, EventRow>();
  for (const row of ordered) if (row.taskId) latestByTask.set(row.taskId, row);

  const finished: HqEventType[] = ["completed"];
  const active = [...latestByTask.values()].filter((r) => !finished.includes(r.eventType) && r.agentId);
  const busyAgents = new Set(active.map((r) => r.agentId));
  const staff = DIVISIONS.flatMap((d) =>
    staffedAgents(d).map((a) => ({ agentId: a.id, divisionId: d.id })),
  ).filter((s) => TASKS[s.agentId]);
  const free = staff.filter((s) => !busyAgents.has(s.agentId));

  const movable = active.filter((r) => r.eventType !== "needs_approval");
  const pendingCount = active.length - movable.length;

  const starts: NewEvent[] = [];
  // Roughly three in four staff busy, so the floor reads as a working team.
  const target = Math.ceil(staff.length * 0.72);
  if (free.length > 0 && movable.length < target && (movable.length === 0 || rand() < 0.7)) {
    const who = pick(free, rand);
    const template = pick(TASKS[who.agentId] ?? [], rand);
    const taskId = `demo-${who.agentId}-${Date.now().toString(36)}-${Math.floor(rand() * 1e6).toString(36)}`;
    starts.push(
      demoEvent({
        agentId: who.agentId,
        divisionId: who.divisionId,
        taskId,
        taskTitle: template.title,
        eventType: "task_started",
        status: "working",
        progress: 5 + Math.floor(rand() * 10),
        payloadJson: { stage: template.stage, summary: `${ORCHESTRATOR_NAME} assigned this task.` },
      }),
    );
  }

  if (movable.length === 0) return starts;
  const row = pick(movable, rand);
  const agentId = row.agentId as string;
  const template = templateFor(agentId, row.taskTitle);
  const stage = template?.stage ?? "Production";
  const base = {
    agentId,
    divisionId: row.divisionId,
    taskId: row.taskId,
    taskTitle: row.taskTitle,
  };

  if (row.eventType === "approved" || row.eventType === "rejected") {
    if (row.eventType === "rejected") {
      return [...starts, demoEvent({ ...base, eventType: "progress", status: "working", progress: 55, payloadJson: { stage, summary: "Rework after review." } })];
    }
    return [...starts, ...finishTask(base, template, stage)];
  }

  const progress = Math.min(100, (row.progress ?? 0) + 9 + Math.floor(rand() * 22));

  if (row.eventType === "blocked") {
    return [...starts, demoEvent({ ...base, eventType: "progress", status: "working", progress, payloadJson: { stage, summary: "Blocker cleared." } })];
  }

  if (progress >= 100) {
    if (template?.needsApproval && pendingCount < 3) {
      return [
        ...starts,
        demoEvent({
          ...base,
          eventType: "needs_approval",
          status: "meeting",
          progress: 100,
          publicSafe: false,
          payloadJson: { stage: "Review & approval", summary: `Ready for your review: ${template.output}.` },
        }),
      ];
    }
    return [...starts, ...finishTask(base, template, stage)];
  }

  if (rand() < 0.05) {
    return [
      ...starts,
      demoEvent({
        ...base,
        eventType: "blocked",
        status: "blocked",
        progress: row.progress,
        publicSafe: false,
        payloadJson: { stage, blocker: pick(BLOCKERS, rand) },
      }),
    ];
  }

  return [
    ...starts,
    demoEvent({
      ...base,
      eventType: "progress",
      status: rand() < 0.22 ? "meeting" : "working",
      progress,
      payloadJson: { stage },
    }),
  ];
}

function finishTask(
  base: Pick<NewEvent, "agentId" | "divisionId" | "taskId" | "taskTitle">,
  template: Template | undefined,
  stage: string,
): NewEvent[] {
  const events: NewEvent[] = [
    demoEvent({
      ...base,
      eventType: "completed",
      status: "idle",
      progress: 100,
      payloadJson: { stage, output: template?.output ?? base.taskTitle },
    }),
  ];
  if (template?.handoffTo && template.handoffTo !== base.divisionId) {
    events.push(
      demoEvent({
        ...base,
        agentId: null,
        eventType: "handoff",
        status: null,
        fromDivisionId: base.divisionId,
        toDivisionId: template.handoffTo,
        payloadJson: { stage, summary: `Handed to ${template.handoffTo}.` },
      }),
    );
  }
  return events;
}
