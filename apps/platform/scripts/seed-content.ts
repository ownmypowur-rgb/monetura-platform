/**
 * seed-content.ts
 *
 * Moves the hardcoded events (5) and marketplace products (15) from
 * src/lib/events-data.ts and src/lib/marketplace-data.ts into the database,
 * unchanged. Idempotent — existing slugs are skipped.
 *
 * Run with: pnpm --filter @monetura/platform seed:content
 */

import path from "path";
import { config as loadDotenv } from "dotenv";

loadDotenv({ path: path.resolve(__dirname, "../.env.local") });
loadDotenv({ path: path.resolve(__dirname, "../../../.env.local") });

import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import {
  moneturaEvents,
  moneturaMarketplaceProducts,
} from "../../../drizzle/monetura-schema";
import { EVENTS } from "../src/lib/events-data";
import { MARKETPLACE_PRODUCTS } from "../src/lib/marketplace-data";

async function seed(): Promise<void> {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    console.error("ERROR: DATABASE_URL is not set.");
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    uri: url,
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(connection, { mode: "default" });

  try {
    // ── Events ────────────────────────────────────────────────────────────
    console.log(`Seeding ${EVENTS.length} events…`);
    for (const event of EVENTS) {
      const existing = await db
        .select({ id: moneturaEvents.id })
        .from(moneturaEvents)
        .where(eq(moneturaEvents.slug, event.slug))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  · ${event.slug} — exists, skipped`);
        continue;
      }

      const sortDate = new Date(event.date);
      if (Number.isNaN(sortDate.getTime())) {
        throw new Error(`Unparseable event date "${event.date}" (${event.slug})`);
      }

      await db.insert(moneturaEvents).values({
        slug: event.slug,
        title: event.title,
        type: event.type,
        typeDot: event.typeDot,
        dateLabel: event.date,
        endDateLabel: event.endDate,
        duration: event.duration,
        location: event.location,
        country: event.country,
        heroImage: event.heroImage,
        tagline: event.tagline,
        description: event.description,
        included: [...event.included],
        priceLabel: event.price,
        priceNote: event.priceNote,
        ctaLabel: event.ctaLabel,
        isPublished: true,
        sortDate,
      });
      console.log(`  ✓ ${event.slug}`);
    }

    // ── Marketplace products ──────────────────────────────────────────────
    console.log(`Seeding ${MARKETPLACE_PRODUCTS.length} products…`);
    for (const product of MARKETPLACE_PRODUCTS) {
      const existing = await db
        .select({ id: moneturaMarketplaceProducts.id })
        .from(moneturaMarketplaceProducts)
        .where(eq(moneturaMarketplaceProducts.slug, product.slug))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  · ${product.slug} — exists, skipped`);
        continue;
      }

      await db.insert(moneturaMarketplaceProducts).values({
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        category: product.category,
        description: product.description,
        longDescription: product.longDescription,
        publicPrice: product.publicPrice,
        memberPrice: product.memberPrice,
        savingsPercent: product.savingsPercent,
        image: product.image,
        images: [...product.images],
        tags: [...product.tags],
        checkoutType: product.checkoutType,
        externalUrl: product.externalUrl ?? null,
        inStock: product.inStock,
        featured: product.featured,
        submittedByMember: product.submittedByMember,
        approvedAt: new Date(product.approvedAt),
        isPublished: true,
      });
      console.log(`  ✓ ${product.slug}`);
    }

    console.log("\n✅ Content seed complete.");
  } finally {
    await connection.end();
  }
}

seed().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
