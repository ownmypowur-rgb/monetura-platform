import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "mysql",
  schema: ["./drizzle/schema.ts", "./drizzle/monetura-schema.ts"],
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env["DATABASE_URL"] as string,
  },
  verbose: true,
  strict: true,
});
