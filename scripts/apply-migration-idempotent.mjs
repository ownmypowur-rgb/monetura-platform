/**
 * Apply one drizzle-kit generated migration to the live database idempotently.
 *
 * Why this exists: the live `__drizzle_migrations` history does not match this
 * repo's journal (DECISIONS.md [Sprint 2]), so `drizzle-kit migrate` must never
 * run against production. This script applies ONLY additive statements:
 *   - CREATE TABLE  → rewritten to CREATE TABLE IF NOT EXISTS
 *   - CREATE INDEX  → skipped when an index of that name already exists
 * Any other statement (ALTER, DROP, …) aborts before anything is executed.
 *
 * Usage (from the repo root; reads DATABASE_URL from apps/platform/.env.local):
 *   node scripts/apply-migration-idempotent.mjs drizzle/migrations/0007_clever_cyclops.sql
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: resolve("apps/platform/.env.local") });

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-migration-idempotent.mjs <migration.sql>");
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (apps/platform/.env.local)");
  process.exit(1);
}

const statements = readFileSync(file, "utf8")
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter(Boolean);

const plan = statements.map((sql) => {
  if (/^CREATE TABLE `/i.test(sql)) {
    return { kind: "table", sql: sql.replace(/^CREATE TABLE `/i, "CREATE TABLE IF NOT EXISTS `") };
  }
  const idx = /^CREATE (?:UNIQUE )?INDEX `([^`]+)` ON `([^`]+)`/i.exec(sql);
  if (idx) return { kind: "index", sql, name: idx[1], table: idx[2] };
  return { kind: "rejected", sql };
});

const rejected = plan.filter((p) => p.kind === "rejected");
if (rejected.length > 0) {
  console.error("Refusing to run — non-additive statements found:\n");
  for (const r of rejected) console.error(r.sql, "\n");
  process.exit(1);
}

const conn = await mysql.createConnection({ uri: url, ssl: { rejectUnauthorized: false } });
try {
  for (const step of plan) {
    if (step.kind === "table") {
      await conn.query(step.sql);
      console.log("✓", step.sql.split("\n")[0]);
      continue;
    }
    const [rows] = await conn.query(
      "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1",
      [step.table, step.name]
    );
    if (rows.length > 0) {
      console.log("· index exists:", step.name);
    } else {
      await conn.query(step.sql);
      console.log("✓ index", step.name);
    }
  }
} finally {
  await conn.end();
}
