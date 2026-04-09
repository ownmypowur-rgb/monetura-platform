"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MARKETPLACE_PRODUCTS,
  CATEGORY_LABELS,
  type MarketplaceProduct,
} from "@/lib/marketplace-data";

export function ProductDetailClient({ product }: { product: MarketplaceProduct }) {
  const [activeImage, setActiveImage] = useState(product.images[0] ?? product.image);

  const related = MARKETPLACE_PRODUCTS.filter(
    (p) => p.category === product.category && p.slug !== product.slug
  ).slice(0, 3);

  return (
    <div style={{ background: "#1A0F0A", minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">

        {/* ── Breadcrumb ───────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-8 text-sm" style={{ color: "#8B6E52" }}>
          <Link href="/dashboard" style={{ color: "#8B6E52", textDecoration: "none" }}>
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/marketplace" style={{ color: "#8B6E52", textDecoration: "none" }}>
            Marketplace
          </Link>
          <span>/</span>
          <span style={{ color: "#C4A882" }}>{product.name}</span>
        </div>

        {/* ── Main product layout ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-16">

          {/* Left — image gallery (3/5 width on desktop) */}
          <div className="lg:col-span-3">
            {/* Main image */}
            <div
              className="rounded-2xl overflow-hidden mb-4"
              style={{
                background: "#2C2420",
                border: "1px solid #4A3728",
                aspectRatio: "4/3",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(img)}
                    className="rounded-xl overflow-hidden flex-shrink-0 transition-all"
                    style={{
                      width: 80,
                      height: 64,
                      border:
                        activeImage === img
                          ? "2px solid #D4A853"
                          : "2px solid #4A3728",
                      padding: 0,
                      background: "none",
                      cursor: "pointer",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — product info (2/5 width on desktop) */}
          <div className="lg:col-span-2 flex flex-col">
            {/* Category + brand */}
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-[10px] font-bold tracking-[0.18em] uppercase px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(212,168,83,0.08)",
                  border: "1px solid rgba(212,168,83,0.2)",
                  color: "#D4A853",
                }}
              >
                {CATEGORY_LABELS[product.category]}
              </span>
              {product.submittedByMember && (
                <span
                  className="text-[10px] font-bold tracking-widest uppercase"
                  style={{ color: "#8B6E52" }}
                >
                  Member Pick
                </span>
              )}
            </div>

            <p
              className="text-xs font-bold tracking-[0.2em] uppercase mb-1"
              style={{ color: "#8B6E52" }}
            >
              {product.brand}
            </p>
            <h1
              className="text-3xl font-semibold leading-tight mb-4"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              {product.name}
            </h1>

            {/* Pricing block */}
            <div
              className="rounded-xl p-4 mb-5"
              style={{
                background: "#2C2420",
                border: "1px solid #4A3728",
              }}
            >
              <div className="flex items-baseline gap-3 mb-2">
                <span
                  className="text-3xl font-semibold"
                  style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
                >
                  ${product.memberPrice.toLocaleString("en-CA")}
                </span>
                <span
                  className="text-base line-through"
                  style={{ color: "#6B5442" }}
                >
                  ${product.publicPrice.toLocaleString("en-CA")}
                </span>
                <span className="text-sm" style={{ color: "#8B6E52" }}>CAD</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: "#C17A4A", color: "#FBF5ED" }}
                >
                  You save {product.savingsPercent}%
                </span>
                <span className="text-xs" style={{ color: "#8B6E52" }}>
                  — member price only
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="flex-1 mb-6">
              {product.longDescription.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed mb-3"
                  style={{ color: "#C4A882" }}
                >
                  {para}
                </p>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    background: "rgba(139,110,82,0.1)",
                    border: "1px solid #4A3728",
                    color: "#8B6E52",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA */}
            {product.checkoutType === "external" && product.externalUrl ? (
              <a
                href={product.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl text-base font-semibold tracking-[0.08em] uppercase text-center transition-all active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #C17A4A 0%, #D4A853 100%)",
                  color: "#2C2420",
                  textDecoration: "none",
                  display: "block",
                  fontFamily: "var(--font-heading)",
                  boxShadow: "0 4px 20px rgba(193,122,74,0.25)",
                }}
              >
                Shop at {product.brand} →
              </a>
            ) : (
              <a
                href="mailto:founders@monetura.com"
                className="w-full py-4 rounded-xl text-base font-semibold tracking-[0.08em] uppercase text-center transition-all active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #C17A4A 0%, #D4A853 100%)",
                  color: "#2C2420",
                  textDecoration: "none",
                  display: "block",
                  fontFamily: "var(--font-heading)",
                  boxShadow: "0 4px 20px rgba(193,122,74,0.25)",
                }}
              >
                Request Member Pricing
              </a>
            )}

            <p className="text-xs text-center mt-3" style={{ color: "#6B5442" }}>
              Member pricing applied automatically at checkout.{" "}
              <a href="mailto:founders@monetura.com" style={{ color: "#8B6E52" }}>
                Questions?
              </a>
            </p>
          </div>
        </div>

        {/* ── You might also like ──────────────────────────────── */}
        {related.length > 0 && (
          <div>
            <p
              className="text-xs font-bold tracking-widest uppercase mb-6"
              style={{ color: "#8B6E52" }}
            >
              You might also like
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/marketplace/${p.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="group rounded-2xl overflow-hidden transition-all"
                    style={{
                      background: "#2C2420",
                      border: "1px solid #4A3728",
                    }}
                  >
                    <div className="h-40 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p
                        className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1"
                        style={{ color: "#8B6E52" }}
                      >
                        {p.brand}
                      </p>
                      <p
                        className="text-base font-semibold group-hover:text-[#D4A853] transition-colors"
                        style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
                      >
                        {p.name}
                      </p>
                      <p
                        className="text-sm font-semibold mt-1"
                        style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
                      >
                        ${p.memberPrice.toLocaleString("en-CA")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
