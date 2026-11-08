/**
 * Ingest allowlist check: one new agent per new division is accepted, and an unknown
 * agent id (and an agent posted under the wrong division) is still rejected.
 * Writes real rows, so run it against a server started WITHOUT DATABASE_URL (the
 * in-memory store), never against production:
 *   DATABASE_URL= pnpm exec next start --port 3013
 *   HQ_BASE_URL=http://localhost:3013 pnpm exec tsx scripts/check-ingest.ts
 * Reads HQ_INGEST_TOKEN from .env.local and never prints it.
 */
import { resolve } from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(".env.local"), quiet: true });

const BASE = process.env["HQ_BASE_URL"] ?? "http://localhost:3013";
const TOKEN = process.env["HQ_INGEST_TOKEN"] ?? "";
let failures = 0;

async function post(agentId: string, divisionId: string): Promise<number> {
  const r = await fetch(`${BASE}/api/hq/events/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({
      agentId,
      divisionId,
      taskId: `ingest-check-${agentId}`,
      taskTitle: "Ingest allowlist check",
      eventType: "task_started",
      progress: 0,
    }),
  });
  return r.status;
}

function check(name: string, ok: boolean, detail: string) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  (${detail})`);
  if (!ok) failures++;
}

async function main() {
  if (TOKEN.length < 32) throw new Error("HQ_INGEST_TOKEN missing from .env.local");
  const cases: [string, string, number][] = [
    ["brand-guardian", "atlas-command", 201],
    ["website-lead", "website-seo", 201],
    ["visual-studio-lead", "visual-studio", 201],
    ["script-writer", "story-lab", 201],
    ["not-a-real-agent", "website-seo", 400],
    ["reel-editor", "website-seo", 400],
  ];
  for (const [agent, division, want] of cases) {
    const status = await post(agent, division);
    check(`${agent} @ ${division} -> ${want}`, status === want, `status ${status}`);
  }
  process.exit(failures > 0 ? 1 : 0);
}

void main();
