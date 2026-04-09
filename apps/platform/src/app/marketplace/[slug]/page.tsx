import { notFound } from "next/navigation";
import { MARKETPLACE_PRODUCTS } from "@/lib/marketplace-data";
import { ProductDetailClient } from "./ProductDetailClient";

export default function MarketplaceProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = MARKETPLACE_PRODUCTS.find((p) => p.slug === params.slug);
  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}
