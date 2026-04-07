/**
 * seed-demo-user.ts
 *
 * Inserts a demo founder account for sales meeting presentations.
 * Run with: pnpm --filter @monetura/platform seed:demo
 *
 * Inserts:
 *   1. ApexCRM `users` row  (login credential — camelCase columns)
 *   2. `monetura_members`   (member profile, tier = founder)
 *   3. `monetura_founder_keys`  (gives founderNumber in session)
 *   4. `monetura_social_accounts` (Instagram connected)
 */

import path from "path";
import { config as loadDotenv } from "dotenv";

// Load DATABASE_URL — check app-level .env.local first, then monorepo root
loadDotenv({ path: path.resolve(__dirname, "../.env.local") });
loadDotenv({ path: path.resolve(__dirname, "../../../.env.local") });

import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { apexcrmUsers } from "../src/lib/apexcrm-users";
import {
  moneturaMembers,
  moneturaFounderKeys,
  moneturaSocialAccounts,
} from "../../../drizzle/monetura-schema";

const DEMO_EMAIL = "demo@monetura.com";
const DEMO_NAME = "Sarah Mitchell";
const DEMO_PASSWORD = "Monetura2024!";
const DEMO_FOUNDER_KEY = "FOUNDER-DEMO-0001";
// openId is required NOT NULL in the ApexCRM users table.
// For a local-credential user we use a deterministic prefix so re-runs are idempotent.
const DEMO_OPEN_ID = `local:${DEMO_EMAIL}`;

async function seed(): Promise<void> {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    console.error(
      "ERROR: DATABASE_URL is not set.\n" +
        "Create apps/platform/.env.local or ensure the root .env.local has DATABASE_URL."
    );
    process.exit(1);
  }

  console.log("Connecting to database…");
  const connection = await mysql.createConnection({
    uri: url,
    // DigitalOcean managed MySQL uses a CA not in Node's default bundle.
    // rejectUnauthorized:false is acceptable for a local seed script.
    ssl: { rejectUnauthorized: false },
  });

  const db = drizzle(connection, { mode: "default" });

  try {
    // ── 1. Check if demo user already exists ──────────────────────────────
    const existingUsers = await db
      .select({ id: apexcrmUsers.id })
      .from(apexcrmUsers)
      .where(eq(apexcrmUsers.email, DEMO_EMAIL))
      .limit(1);

    if (existingUsers.length > 0) {
      console.log("Demo user already exists — skipping insertion.");
      console.log(`\n  Email:    ${DEMO_EMAIL}`);
      console.log(`  Password: ${DEMO_PASSWORD}`);
      return;
    }

    // ── 2. Hash password (12 rounds) ─────────────────────────────────────
    console.log("Hashing password (12 rounds)…");
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    // ── 3. Insert into ApexCRM users table ────────────────────────────────
    // Column names are camelCase in the live ApexCRM DB (confirmed via DESCRIBE users).
    // role defaults to 'user'; loginMethod, avatarUrl default to NULL — safe to omit.
    console.log("Inserting into ApexCRM users table…");
    await connection.execute(
      `INSERT INTO users (openId, email, name, passwordHash, loginMethod, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [DEMO_OPEN_ID, DEMO_EMAIL, DEMO_NAME, passwordHash, "credentials", "user"]
    );

    // Fetch the auto-incremented id
    const [userRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [DEMO_EMAIL]
    );
    const apexUserId = (userRows[0] as { id: number } | undefined)?.id;
    if (!apexUserId) throw new Error("Failed to retrieve inserted user id");
    console.log(`  ✓ ApexCRM user inserted  (id = ${apexUserId})`);

    // ── 4. Insert into monetura_members ───────────────────────────────────
    // monetura_members uses snake_case columns (matches the Drizzle schema).
    console.log("Inserting into monetura_members…");
    const existingMembers = await db
      .select({ id: moneturaMembers.id })
      .from(moneturaMembers)
      .where(eq(moneturaMembers.email, DEMO_EMAIL))
      .limit(1);

    let memberId: number;

    if (existingMembers.length > 0 && existingMembers[0] !== undefined) {
      memberId = existingMembers[0].id;
      console.log(`  ✓ monetura_members row already exists (id = ${memberId})`);
    } else {
      const [memberInsert] = await db.insert(moneturaMembers).values({
        email: DEMO_EMAIL,
        name: DEMO_NAME,
        membershipTier: "founder",
        status: "active",
        city: "Vancouver, BC",
        bio: "Travel creator and lifestyle entrepreneur",
      });
      const insertResult = memberInsert as unknown as { insertId: number };
      memberId = insertResult.insertId;
      console.log(`  ✓ monetura_members inserted (id = ${memberId})`);
    }

    // ── 5. Insert founder key ─────────────────────────────────────────────
    // The founder key's auto-increment id becomes founderNumber in the session.
    console.log("Inserting into monetura_founder_keys…");
    const existingKey = await db
      .select({ id: moneturaFounderKeys.id })
      .from(moneturaFounderKeys)
      .where(eq(moneturaFounderKeys.memberId, memberId))
      .limit(1);

    let founderNumber: number;

    if (existingKey.length > 0 && existingKey[0] !== undefined) {
      founderNumber = existingKey[0].id;
      console.log(`  ✓ founder key already exists (founderNumber = ${founderNumber})`);
    } else {
      const [keyInsert] = await db.insert(moneturaFounderKeys).values({
        memberId,
        keyCode: DEMO_FOUNDER_KEY,
        founderTier: "gold",
      });
      const keyResult = keyInsert as unknown as { insertId: number };
      founderNumber = keyResult.insertId;
      console.log(`  ✓ founder key inserted (founderNumber = ${founderNumber})`);
    }

    // ── 6. Insert Instagram social account ───────────────────────────────
    console.log("Inserting Instagram social account…");
    await db.insert(moneturaSocialAccounts).values({
      memberId,
      platform: "instagram",
      handle: "sarah.explores",
      profileUrl: "https://instagram.com/sarah.explores",
      followerCount: 24847,
      isVerified: false,
    });
    console.log("  ✓ Instagram account linked (@sarah.explores)");

    // ── Done ──────────────────────────────────────────────────────────────
    console.log("\n✅ Demo seed complete!");
    console.log("─────────────────────────────────────────");
    console.log(`  Email:         ${DEMO_EMAIL}`);
    console.log(`  Password:      ${DEMO_PASSWORD}`);
    console.log(`  Member tier:   founder`);
    console.log(`  Founder #:     ${founderNumber}`);
    console.log(`  Instagram:     @sarah.explores`);
    console.log("─────────────────────────────────────────");
    console.log("  → Visit /login and sign in\n");
  } finally {
    await connection.end();
  }
}

seed().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
