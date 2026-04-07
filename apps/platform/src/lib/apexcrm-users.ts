// ApexCRM users table — READ ONLY — NEVER write to this table from app code.
// This is a minimal read-only definition for authentication queries only.
// The full ApexCRM schema lives in drizzle/schema.ts — do not modify that file.
//
// Column names match the LIVE ApexCRM database (camelCase) as confirmed via DESCRIBE users.

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
  openId: varchar("openId", { length: 64 }).notNull(),
  email: varchar("email", { length: 320 }),
  name: varchar("name", { length: 255 }),
  passwordHash: varchar("passwordHash", { length: 512 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow(),
});
