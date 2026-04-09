"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MARKETPLACE_PRODUCTS,
  CATEGORY_LABELS,
  type MarketplaceCategory,
} from "@/lib/marketplace-data";

type FilterCategory = "all" | MarketplaceCategory;

const FILTER_OPTIONS: { id: FilterCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "travel-gear", label: "Travel Gear" },
  { id: "swimwear-beach", label: "Swimwear & Beach" },
  { id: "photography", label: "Photography" },
  { id: "wellness", label: "Wellness" },
];

function ProductCard({ product }: { product: (typeof MARKETPLACE_PRODUCTS)[number] }) {
  return (
    <Link
      href={`/marketplace/${product.slug}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        className="group rounded-2xl overflow-hidden transition-all"
        style={{
          background: "#2C2420",
          border: "1px solid #4A3728",
          boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
        }}
      >
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Savings badge */}
          <div
            className="absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-bold tracking-wide"
            style={{
              background: "#C17A4A",
              color: "#FBF5ED",
            }}
          >
            Save {product.savingsPercent}%
          </div>
          {/* Featured badge */}
          {product.featured && (
            <div
              className="absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-bold tracking-widest uppercase"
              style={{
                background: "rgba(212,168,83,0.15)",
                border: "1px solid rgba(212,168,83,0.4)",
                color: "#D4A853",
              }}
            >
              Featured
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <p
            className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1"
            style={{ color: "#8B6E52" }}
          >
            {product.brand}
          </p>
          <h3
            className="text-base font-semibold leading-snug mb-3 transition-colors group-hover:text-[#D4A853]"
            style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
          >
            {product.name}
          </h3>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 mb-4">
            <span
              className="text-lg font-semibold"
              style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
            >
              ${product.memberPrice.toLocaleString("en-CA")}
            </span>
            <span
              className="text-sm line-through"
              style={{ color: "#6B5442" }}
            >
              ${product.publicPrice.toLocaleString("en-CA")}
            </span>
            <span className="text-xs" style={{ color: "#8B6E52" }}>CAD</span>
          </div>

          {/* CTA */}
          <div
            className="w-full py-2.5 rounded-xl text-sm font-medium text-center tracking-[0.06em] transition-all"
            style={{
              border: "1px solid rgba(212,168,83,0.4)",
              color: "#D4A853",
              fontFamily: "var(--font-heading)",
            }}
          >
            View Product →
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MarketplacePage() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");

  const featured = MARKETPLACE_PRODUCTS.filter((p) => p.featured);
  const filtered =
    activeFilter === "all"
      ? MARKETPLACE_PRODUCTS
      : MARKETPLACE_PRODUCTS.filter((p) => p.category === activeFilter);

  return (
    <div style={{ background: "#1A0F0A", minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="mb-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
            style={{ color: "#8B6E52", textDecoration: "none" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            Dashboard
          </Link>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#8B6E52" }}>
            Member Marketplace
          </p>
          <h1
            className="text-4xl font-semibold"
            style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
          >
            Curated Products
          </h1>
          <p className="mt-2 text-base" style={{ color: "#C4A882" }}>
            Partner brands and member-submitted gear — exclusively at Monetura member pricing.
          </p>
        </div>

        {/* ── Member savings callout ───────────────────────────── */}
        <div
          className="rounded-2xl px-6 py-4 mb-10 flex items-center gap-4"
          style={{
            background: "rgba(212,168,83,0.07)",
            border: "1px solid rgba(212,168,83,0.2)",
          }}
        >
          <span className="text-xl" style={{ color: "#D4A853" }}>✦</span>
          <p className="text-sm" style={{ color: "#C4A882" }}>
            As a Monetura member you save an average of{" "}
            <span style={{ color: "#D4A853", fontFamily: "var(--font-heading)", fontWeight: 600 }}>
              22% across every product
            </span>{" "}
            in the marketplace — exclusive pricing not available to the public.
          </p>
          <Link
            href="/marketplace/submit"
            className="ml-auto text-xs font-bold tracking-widest uppercase whitespace-nowrap"
            style={{ color: "#8B6E52", textDecoration: "none" }}
          >
            Submit a Product
          </Link>
        </div>

        {/* ── Featured row ─────────────────────────────────────── */}
        {activeFilter === "all" && (
          <div className="mb-12">
            <p
              className="text-xs font-bold tracking-widest uppercase mb-5"
              style={{ color: "#8B6E52" }}
            >
              Featured
            </p>
            <div className="flex gap-5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {featured.map((product) => (
                <div key={product.slug} className="flex-shrink-0 w-72">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Filter pills ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setActiveFilter(opt.id)}
              className="px-4 py-2 rounded-full text-sm font-medium tracking-wide transition-all"
              style={{
                background:
                  activeFilter === opt.id
                    ? "rgba(212,168,83,0.12)"
                    : "transparent",
                border:
                  activeFilter === opt.id
                    ? "1px solid rgba(212,168,83,0.4)"
                    : "1px solid #4A3728",
                color: activeFilter === opt.id ? "#D4A853" : "#8B6E52",
                fontFamily: "var(--font-heading)",
              }}
            >
              {opt.label}
            </button>
          ))}

          <span className="ml-auto text-sm" style={{ color: "#6B5442" }}>
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Product grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filtered.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>

        {/* ── Submit CTA ───────────────────────────────────────── */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: "#2C2420",
            border: "1px solid #4A3728",
          }}
        >
          <p
            className="text-xs font-bold tracking-widest uppercase mb-3"
            style={{ color: "#8B6E52" }}
          >
            Know a great product?
          </p>
          <h2
            className="text-2xl font-semibold mb-3"
            style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
          >
            Submit to the Marketplace
          </h2>
          <p className="text-sm mb-6" style={{ color: "#C4A882" }}>
            Members can submit products for review. Approved submissions earn you a $50 credit and a mention in our monthly newsletter.
          </p>
          <Link
            href="/marketplace/submit"
            className="inline-block px-8 py-3.5 rounded-xl text-sm font-semibold tracking-[0.08em] uppercase"
            style={{
              background: "linear-gradient(135deg, #C17A4A 0%, #D4A853 100%)",
              color: "#2C2420",
              textDecoration: "none",
              fontFamily: "var(--font-heading)",
            }}
          >
            Submit a Product
          </Link>
        </div>

      </div>
    </div>
  );
}
