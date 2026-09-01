import { getPublishedProducts } from "@monetura/db";
import { toMarketplaceProduct } from "@/lib/marketplace-map";
import { MarketplaceClient } from "./MarketplaceClient";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const rows = await getPublishedProducts().catch(() => []);
  const products = rows.map(toMarketplaceProduct);

  // Real average — no hardcoded marketing claims.
  const withSavings = products.filter((p) => p.savingsPercent > 0);
  const averageSavingsPercent =
    withSavings.length > 0
      ? Math.round(
          withSavings.reduce((sum, p) => sum + p.savingsPercent, 0) /
            withSavings.length
        )
      : 0;

  return (
    <MarketplaceClient
      products={products}
      averageSavingsPercent={averageSavingsPercent}
    />
  );
}
