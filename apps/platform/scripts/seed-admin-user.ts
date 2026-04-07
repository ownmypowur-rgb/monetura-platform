/**
 * seed-admin-user.ts
 *
 * Inserts the Monetura admin account for owner access to the admin console.
 * Run with: pnpm --filter @monetura/platform seed:admin
 *
 * Inserts:
 *   1. ApexCRM `users` row  (login credential)
 *   2. `monetura_members`   (member profile, tier = admin, status = active)
 */

import path from "path";
import { config as loadDotenv } from "dotenv";

// Load DATABASE_URL from app .env.local or monorepo root
loadDotenv({ path: path.resolve(__dirname, "../.env.local") });
loadDotenv({ path: path.resolve(__dirname, "../../../.env.local") });

import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { apexcrmUsers } from "../src/lib/apexcrm-users";
import { moneturaMembers } from "../../../drizzle/monetura-schema";

const ADMIN_EMAIL = "admin@monetura.com";
const ADMIN_NAME = "Monetura Admin";
const ADMIN_PASSWORD = "MoneturaAdmin2024!";
const ADMIN_OPEN_ID = `local:${ADMIN_EMAIL}`;

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
    ssl: { rejectUnauthorized: false },
  });

  const db = drizzle(connection, { mode: "default" });

  try {
    // ── 1. Check if admin already exists ──────────────────────────────────
    const existingUsers = await db
      .select({ id: apexcrmUsers.id })
      .from(apexcrmUsers)
      .where(eq(apexcrmUsers.email, ADMIN_EMAIL))
      .limit(1);

    if (existingUsers.length > 0) {
      console.log("Admin user already exists — skipping insertion.");
      console.log(`\n  Email:    ${ADMIN_EMAIL}`);
      console.log(`  Password: ${ADMIN_PASSWORD}`);
      return;
    }

    // ── 2. Hash password ──────────────────────────────────────────────────
    console.log("Hashing password (12 rounds)…");
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    // ── 3. Insert into ApexCRM users table ────────────────────────────────
    console.log("Inserting into ApexCRM users table…");
    await connection.execute(
      `INSERT INTO users (openId, email, name, passwordHash, loginMethod, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ADMIN_OPEN_ID, ADMIN_EMAIL, ADMIN_NAME, passwordHash, "credentials", "admin"]
    );

    const [userRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [ADMIN_EMAIL]
    );
    const apexUserId = (userRows[0] as { id: number } | undefined)?.id;
    if (!apexUserId) throw new Error("Failed to retrieve inserted user id");
    console.log(`  ✓ ApexCRM user inserted  (id = ${apexUserId})`);

    // ── 4. Insert into monetura_members ───────────────────────────────────
    console.log("Inserting into monetura_members…");
    const existingMembers = await db
      .select({ id: moneturaMembers.id })
      .from(moneturaMembers)
      .where(eq(moneturaMembers.email, ADMIN_EMAIL))
      .limit(1);

    if (existingMembers.length > 0) {
      console.log("  ✓ monetura_members row already exists — skipping.");
    } else {
      await db.insert(moneturaMembers).values({
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        membershipTier: "admin",
        status: "active",
      });
      console.log("  ✓ monetura_members inserted (admin tier, active status)");
    }

    // ── Done ──────────────────────────────────────────────────────────────
    console.log("\n✅ Admin seed complete!");
    console.log("─────────────────────────────────────────");
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log(`  Tier:     admin`);
    console.log("─────────────────────────────────────────");
    console.log("  → Visit /login and sign in\n");
    console.log("  → Admin console at /admin/founders\n");
  } finally {
    await connection.end();
  }
}

seed().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
