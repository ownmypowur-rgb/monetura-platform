// ApexCRM users table — READ ONLY — NEVER write to this table
// This is a minimal read-only definition for authentication queries only.
// The full ApexCRM schema lives in drizzle/schema.ts — do not modify that file.

import {
  mysqlTable,
  bigint,
  varchar,
  timestamp,
} from "drizzle-orm/mysql-core";

export const apexcrmUsers = mysqlTable("users", {
  id: bigint("id", { mode: "number", unsigned: true })
    .primaryKey()
    .autoincrement(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});
