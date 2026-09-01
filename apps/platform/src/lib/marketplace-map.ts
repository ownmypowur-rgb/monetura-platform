import type { ProductRow } from "@monetura/db";
import type {
  MarketplaceCategory,
  MarketplaceProduct,
} from "@/lib/marketplace-data";

/** Maps a monetura_marketplace_products row to the UI product shape. */
export function toMarketplaceProduct(row: ProductRow): MarketplaceProduct {
  return {
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category as MarketplaceCategory,
    description: row.description ?? "",
    longDescription: row.longDescription ?? "",
    publicPrice: row.publicPrice,
    memberPrice: row.memberPrice,
    savingsPercent: row.savingsPercent,
    image: row.image ?? "",
    images: row.images ?? (row.image ? [row.image] : []),
    tags: row.tags ?? [],
    checkoutType: row.checkoutType,
    externalUrl: row.externalUrl ?? undefined,
    inStock: row.inStock,
    featured: row.featured,
    submittedByMember: row.submittedByMember,
    approvedAt: (row.approvedAt ?? row.createdAt).toISOString(),
  };
}
