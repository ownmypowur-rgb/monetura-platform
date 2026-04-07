import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import type { MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as moneturaSchema from "../../../drizzle/monetura-schema";

export type Database = MySql2Database<typeof moneturaSchema>;

// Lazy singleton — pool and db are created on first query, not at import time.
// This prevents build-time failures when DATABASE_URL is not set locally.
let _db: Database | null = null;

export function getDb(): Database {
  if (_db) return _db;

  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL environment variable is required");

  const pool = mysql.createPool({
    uri: url,
    // DigitalOcean managed MySQL uses a CA not in Node's default bundle.
    // rejectUnauthorized:false keeps TLS encryption while accepting the DO cert chain.
    ssl: { rejectUnauthorized: false },
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  });

  _db = drizzle(pool, { schema: moneturaSchema, mode: "default" });
  return _db;
}

// Re-export schema for convenience
export * from "../../../drizzle/monetura-schema";
