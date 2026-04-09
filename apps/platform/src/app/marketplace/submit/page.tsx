"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORY_LABELS, type MarketplaceCategory } from "@/lib/marketplace-data";

const CATEGORIES: MarketplaceCategory[] = [
  "travel-gear",
  "swimwear-beach",
  "photography",
  "wellness",
];

export default function MarketplaceSubmitPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    productName: "",
    brand: "",
    category: "" as MarketplaceCategory | "",
    publicPrice: "",
    memberPrice: "",
    description: "",
    productUrl: "",
    imageUrl: "",
    adminNotes: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate async submission
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  }

  const inputStyle = {
    background: "#2C2420",
    border: "1px solid #4A3728",
    color: "#FBF5ED",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  } as React.CSSProperties;

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#8B6E52",
    marginBottom: "8px",
  } as React.CSSProperties;

  if (submitted) {
    return (
      <div style={{ background: "#1A0F0A", minHeight: "100vh" }}>
        <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6">
          <div className="flex flex-col items-center text-center py-24">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
              style={{
                background: "rgba(212,168,83,0.1)",
                border: "1px solid rgba(212,168,83,0.3)",
              }}
            >
              <span className="text-2xl" style={{ color: "#D4A853" }}>✦</span>
            </div>
            <p
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{ color: "#8B6E52" }}
            >
              Submission Received
            </p>
            <h1
              className="text-3xl font-semibold mb-4"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              Thank you!
            </h1>
            <p className="text-base mb-2" style={{ color: "#C4A882" }}>
              Your product has been submitted for review.
            </p>
            <p className="text-sm mb-10" style={{ color: "#8B6E52" }}>
              Approved submissions earn you a{" "}
              <span style={{ color: "#D4A853" }}>$50 credit</span> and a mention in our
              monthly newsletter. We review submissions within 48 hours.
            </p>
            <div className="flex gap-4">
              <Link
                href="/marketplace"
                className="px-6 py-3 rounded-xl text-sm font-semibold tracking-[0.08em] uppercase"
                style={{
                  background: "linear-gradient(135deg, #C17A4A 0%, #D4A853 100%)",
                  color: "#2C2420",
                  textDecoration: "none",
                  fontFamily: "var(--font-heading)",
                }}
              >
                Back to Marketplace
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl text-sm font-semibold tracking-[0.08em] uppercase"
                style={{
                  background: "transparent",
                  border: "1px solid #4A3728",
                  color: "#E8DCCB",
                  textDecoration: "none",
                  fontFamily: "var(--font-heading)",
                }}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#1A0F0A", minHeight: "100vh" }}>
      <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6">

        {/* ── Breadcrumb ───────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-8 text-sm" style={{ color: "#8B6E52" }}>
          <Link href="/marketplace" style={{ color: "#8B6E52", textDecoration: "none" }}>
            Marketplace
          </Link>
          <span>/</span>
          <span style={{ color: "#C4A882" }}>Submit a Product</span>
        </div>

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#8B6E52" }}>
            Member Contribution
          </p>
          <h1
            className="text-3xl font-semibold mb-2"
            style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
          >
            Submit a Product
          </h1>
          <p className="text-sm" style={{ color: "#C4A882" }}>
            Know a product that belongs in the Monetura marketplace? Submit it for review.
            Approved submissions earn you a $50 credit and a newsletter mention.
          </p>
        </div>

        {/* ── Form ─────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit}>
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{
              background: "#2C2420",
              border: "1px solid #4A3728",
            }}
          >
            {/* Product name + brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label style={labelStyle}>Product Name</label>
                <input
                  type="text"
                  name="productName"
                  value={form.productName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Travel Pack 40L"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  required
                  placeholder="e.g. NOMATIC"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={labelStyle}>Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                style={{ ...inputStyle, appearance: "none" }}
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label style={labelStyle}>Public / Retail Price (CAD)</label>
                <input
                  type="number"
                  name="publicPrice"
                  value={form.publicPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="299.00"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Suggested Member Price (CAD)</label>
                <input
                  type="number"
                  name="memberPrice"
                  value={form.memberPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="239.00"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Why does this product belong in the Monetura marketplace? What makes it exceptional?"
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label style={labelStyle}>Product URL</label>
                <input
                  type="url"
                  name="productUrl"
                  value={form.productUrl}
                  onChange={handleChange}
                  required
                  placeholder="https://brand.com/product"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Image URL (optional)</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleChange}
                  placeholder="https://…"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Admin notes */}
            <div>
              <label style={labelStyle}>Additional Notes (optional)</label>
              <textarea
                name="adminNotes"
                value={form.adminNotes}
                onChange={handleChange}
                rows={3}
                placeholder="Anything else the Monetura team should know — partnership contacts, discount codes, etc."
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-4 rounded-xl text-base font-semibold tracking-[0.08em] uppercase transition-all active:scale-[0.98]"
            style={{
              background: loading
                ? "rgba(212,168,83,0.3)"
                : "linear-gradient(135deg, #C17A4A 0%, #D4A853 100%)",
              color: "#2C2420",
              fontFamily: "var(--font-heading)",
              boxShadow: loading ? "none" : "0 4px 20px rgba(193,122,74,0.25)",
              cursor: loading ? "not-allowed" : "pointer",
              border: "none",
            }}
          >
            {loading ? "Submitting…" : "Submit for Review"}
          </button>

          <p className="text-xs text-center mt-4" style={{ color: "#6B5442" }}>
            Submissions are reviewed within 48 hours. Questions?{" "}
            <a href="mailto:founders@monetura.com" style={{ color: "#8B6E52" }}>
              founders@monetura.com
            </a>
          </p>
        </form>

      </div>
    </div>
  );
}
