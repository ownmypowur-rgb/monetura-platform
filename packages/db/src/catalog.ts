import "server-only";
import { and, asc, eq, gte, ne } from "drizzle-orm";
import {
  getDb,
  moneturaEvents,
  moneturaMarketplaceProducts,
} from "./index";

export type EventRow = typeof moneturaEvents.$inferSelect;
export type ProductRow = typeof moneturaMarketplaceProducts.$inferSelect;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Published events with sort_date today or later, soonest first. */
export async function getUpcomingEvents(limit = 50): Promise<EventRow[]> {
  return getDb()
    .select()
    .from(moneturaEvents)
    .where(
      and(
        eq(moneturaEvents.isPublished, true),
        gte(moneturaEvents.sortDate, startOfToday())
      )
    )
    .orderBy(asc(moneturaEvents.sortDate))
    .limit(limit);
}

/** A single published event by slug, or null. */
export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  const rows = await getDb()
    .select()
    .from(moneturaEvents)
    .where(
      and(eq(moneturaEvents.slug, slug), eq(moneturaEvents.isPublished, true))
    )
    .limit(1);
  return rows[0] ?? null;
}

/** All published marketplace products. */
export async function getPublishedProducts(): Promise<ProductRow[]> {
  return getDb()
    .select()
    .from(moneturaMarketplaceProducts)
    .where(eq(moneturaMarketplaceProducts.isPublished, true))
    .orderBy(asc(moneturaMarketplaceProducts.id));
}

/** A single published product by slug, or null. */
export async function getProductBySlug(
  slug: string
): Promise<ProductRow | null> {
  const rows = await getDb()
    .select()
    .from(moneturaMarketplaceProducts)
    .where(
      and(
        eq(moneturaMarketplaceProducts.slug, slug),
        eq(moneturaMarketplaceProducts.isPublished, true)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Up to `limit` other published products in the same category. */
export async function getRelatedProducts(
  category: string,
  excludeSlug: string,
  limit = 3
): Promise<ProductRow[]> {
  return getDb()
    .select()
    .from(moneturaMarketplaceProducts)
    .where(
      and(
        eq(moneturaMarketplaceProducts.isPublished, true),
        eq(moneturaMarketplaceProducts.category, category),
        ne(moneturaMarketplaceProducts.slug, excludeSlug)
      )
    )
    .orderBy(asc(moneturaMarketplaceProducts.id))
    .limit(limit);
}
