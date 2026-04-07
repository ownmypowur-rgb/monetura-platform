// ApexCRM users table — READ-WRITE stub for webinar registration only.
// Column names match the LIVE ApexCRM database (camelCase) as confirmed via DESCRIBE users.
// Do NOT modify drizzle/schema.ts — this is a local marketing-app stub only.

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
