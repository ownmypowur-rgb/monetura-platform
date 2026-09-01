import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@monetura/db";
import { toMarketplaceProduct } from "@/lib/marketplace-map";
import { ProductDetailClient } from "./ProductDetailClient";

export const dynamic = "force-dynamic";

export default async function MarketplaceProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const row = await getProductBySlug(params.slug);
  if (!row) notFound();

  const relatedRows = await getRelatedProducts(row.category, row.slug, 3).catch(
    () => []
  );

  return (
    <ProductDetailClient
      product={toMarketplaceProduct(row)}
      related={relatedRows.map(toMarketplaceProduct)}
    />
  );
}
