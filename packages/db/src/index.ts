import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as moneturaSchema from "../../../drizzle/monetura-schema";

if (!process.env["DATABASE_URL"]) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = mysql.createPool({
  uri: process.env["DATABASE_URL"],
  ssl: { rejectUnauthorized: true },
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});

export const db = drizzle(pool, {
  schema: moneturaSchema,
  mode: "default",
});

export type Database = typeof db;

// Re-export schema for convenience
export * from "../../../drizzle/monetura-schema";
