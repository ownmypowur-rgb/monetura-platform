/**
 * Seeds realistic is_demo = true events so the island has history on first load.
 * Run from apps/hq: pnpm seed:demo
 * Reads DATABASE_URL from apps/hq/.env.local, else apps/platform/.env.local.
 * Writes only to monetura_hq_events, and only rows flagged is_demo = true.
 */
import { resolve } from "node:path";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import { desc } from "drizzle-orm";
import mysql from "mysql2/promise";
import { moneturaHqEvents } from "../../../drizzle/monetura-schema";
import { nextDemoEvents, type EventRow } from "../src/server/demo";

dotenv.config({ path: resolve(".env.local"), quiet: true });
if (!process.env["DATABASE_URL"]) dotenv.config({ path: resolve("../platform/.env.local"), quiet: true });

const TICKS = Number(process.argv[2] ?? 90);

async function main() {
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is not set");
  const conn = await mysql.createConnection({ uri: url, ssl: { rejectUnauthorized: false } });
  const db = drizzle(conn, { mode: "default" });

  const existing = await db.select().from(moneturaHqEvents).orderBy(desc(moneturaHqEvents.id)).limit(400);
  const rows: EventRow[] = existing.map((r) => ({ ...r, eventType: r.eventType }));
  let fakeId = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
  let inserted = 0;
  const start = Date.now() - TICKS * 45_000;

  for (let i = 0; i < TICKS; i++) {
    const createdAt = new Date(start + i * 45_000);
    for (const e of nextDemoEvents(rows)) {
      await db.insert(moneturaHqEvents).values({
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
        isDemo: true,
        createdAt,
      });
      rows.push({ ...e, id: fakeId++, createdAt, isDemo: true });
      inserted++;
    }
  }
  console.log(`Seeded ${inserted} demo events.`);
  await conn.end();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : "Seed failed");
  process.exit(1);
});
