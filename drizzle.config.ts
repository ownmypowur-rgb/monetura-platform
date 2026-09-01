import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "mysql",
  // ApexCRM's ./drizzle/schema.ts is deliberately NOT listed here — drizzle-kit
  // must never diff or emit migrations against ApexCRM production tables.
  schema: ["./drizzle/monetura-schema.ts"],
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env["DATABASE_URL"] as string,
  },
  verbose: true,
  strict: true,
});
