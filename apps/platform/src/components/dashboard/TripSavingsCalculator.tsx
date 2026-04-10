"use client";

import { useState } from "react";
import { CalculatorIcon } from "./icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Currency = "CAD" | "USD";

interface TripInputs {
  publicPrice: string;
  memberPrice: string;
  airlines: string;
  transportation: string;
  food: string;
  entertainment: string;
  taxBracket: string;
  isBusiness: boolean;
  currency: Currency;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USD_RATE = 0.74;

function parseNum(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) || n < 0 ? 0 : n;
}

function fmt(amount: number, currency: Currency): string {
  const converted = currency === "USD" ? amount * USD_RATE : amount;
  return converted.toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function hasAnyInput(inputs: TripInputs): boolean {
  return (
    inputs.publicPrice !== "" ||
    inputs.memberPrice !== "" ||
    inputs.airlines !== "" ||
    inputs.transportation !== "" ||
    inputs.food !== "" ||
    inputs.entertainment !== "" ||
    inputs.taxBracket !== ""
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

// Section headers: ACCOMMODATION SAVINGS, TOTAL TRIP COST, TAX INFORMATION
const sectionLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",   // text-xs
  fontWeight: 700,       // font-bold
  letterSpacing: "0.1em", // tracking-widest
  textTransform: "uppercase" as const,
  color: "#C4A882",
  marginBottom: "0.6rem",
};

// Input field labels: HIGHEST TAX BRACKET, ENTERTAINMENT, etc.
const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",   // text-xs
  fontWeight: 600,       // font-semibold
  letterSpacing: "0.08em", // tracking-wider
  textTransform: "uppercase" as const,
  color: "#8B6E52",
  marginBottom: "0.35rem",
};

// Input fields: text-base
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#1A100C",
  border: "1px solid #3D2E26",
  borderRadius: "0.5rem",
  color: "#FBF5ED",
  padding: "0.5rem 0.75rem",
  fontSize: "1rem",      // text-base
  outline: "none",
  transition: "border-color 0.15s",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NumberInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={fieldLabelStyle}>{label}</label>
      <input
        type="number"
        min={0}
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle,
          borderColor: focused ? "#D4A853" : "#3D2E26",
        }}
      />
    </div>
  );
}

// Line item rows — label text-base, value text-base font-semibold
function ResultRow({
  label,
  value,
  color,
  bold,
  small,
}: {
  label: string;
  value?: string;
  color?: string;
  bold?: boolean;
  small?: boolean;
}) {
  return (
    <div
      className="flex items-baseline justify-between"
      style={{ marginBottom: small ? "0.1rem" : "0.4rem" }}
    >
      <span
        style={{
          color: color ?? "#8B6E52",
          fontSize: small ? "0.78rem" : "1rem",  // text-base
          fontStyle: small ? "italic" : undefined,
        }}
      >
        {label}
      </span>
      {value !== undefined && (
        <span
          style={{
            color: color ?? "#FBF5ED",
            fontSize: small ? "0.78rem" : "1rem",  // text-base
            fontWeight: bold ? 700 : 600,           // font-semibold minimum
          }}
        >
          {value}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Widget
// ---------------------------------------------------------------------------

export function TripSavingsCalculator() {
  const [inputs, setInputs] = useState<TripInputs>({
    publicPrice: "",
    memberPrice: "",
    airlines: "",
    transportation: "",
    food: "",
    entertainment: "",
    taxBracket: "",
    isBusiness: false,
    currency: "CAD",
  });

  function set(field: keyof TripInputs, value: string | boolean) {
    setInputs((prev) => ({ ...prev, [field]: value }));
  }

  // ---- Calculations ----
  const publicPrice = parseNum(inputs.publicPrice);
  const memberPrice = parseNum(inputs.memberPrice);
  const airlines = parseNum(inputs.airlines);
  const transportation = parseNum(inputs.transportation);
  const food = parseNum(inputs.food);
  const entertainment = parseNum(inputs.entertainment);
  const taxBracket = Math.min(53, Math.max(0, parseNum(inputs.taxBracket)));

  const accommodationSavings = Math.max(0, publicPrice - memberPrice);
  const accommodationSavingsPercent =
    publicPrice > 0 ? (accommodationSavings / publicPrice) * 100 : 0;

  // Total trip cost uses member (actual) accommodation price, not public price
  const totalTripCost =
    airlines + transportation + food + entertainment + memberPrice;

  const taxSavings = inputs.isBusiness
    ? totalTripCost * (taxBracket / 100)
    : 0;

  const grandTotalBenefit = accommodationSavings + taxSavings;

  const cur = inputs.currency;
  const showResults = hasAnyInput(inputs);

  function reset() {
    setInputs({
      publicPrice: "",
      memberPrice: "",
      airlines: "",
      transportation: "",
      food: "",
      entertainment: "",
      taxBracket: "",
      isBusiness: false,
      currency: "CAD",
    });
  }

  function handleSave() {
    console.log("Save trip:", {
      inputs,
      accommodationSavings,
      totalTripCost,
      taxSavings,
      grandTotalBenefit,
    });
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#2C2420",
        border: "1px solid #4A3728",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* Accent bar */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, #C17A4A 0%, #D4A853 40%, transparent 100%)",
        }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <p
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: "#C4A882" }}
          >
            Trip Savings Calculator
          </p>
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
            style={{
              background: "rgba(212,168,83,0.08)",
              border: "1px solid rgba(212,168,83,0.2)",
            }}
          >
            <CalculatorIcon size={20} style={{ color: "#D4A853" }} />
          </div>
        </div>

        {/* Form grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Left: Accommodation */}
          <div className="space-y-3">
            <p style={{ ...sectionLabelStyle, marginBottom: "0.5rem" }}>
              Accommodation
            </p>
            <NumberInput
              label="Public price (CAD)"
              value={inputs.publicPrice}
              onChange={(v) => set("publicPrice", v)}
              placeholder="$450"
            />
            <NumberInput
              label="Member price (CAD)"
              value={inputs.memberPrice}
              onChange={(v) => set("memberPrice", v)}
              placeholder="$320"
            />
          </div>

          {/* Right: Trip Expenses */}
          <div className="space-y-3">
            <p style={{ ...sectionLabelStyle, marginBottom: "0.5rem" }}>
              Trip Expenses
            </p>
            <NumberInput
              label="Airline tickets"
              value={inputs.airlines}
              onChange={(v) => set("airlines", v)}
              placeholder="$600"
            />
            <NumberInput
              label="Transportation"
              value={inputs.transportation}
              onChange={(v) => set("transportation", v)}
              placeholder="$150"
            />
            <NumberInput
              label="Food &amp; beverages"
              value={inputs.food}
              onChange={(v) => set("food", v)}
              placeholder="$400"
            />
            <NumberInput
              label="Entertainment"
              value={inputs.entertainment}
              onChange={(v) => set("entertainment", v)}
              placeholder="$200"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="mb-5 h-px" style={{ background: "#3D2E26" }} />

        {/* Tax Information */}
        <div className="mb-5 space-y-4">
          <p style={sectionLabelStyle}>Tax Information</p>

          {/* Tax bracket + currency row */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <NumberInput
                label="Highest tax bracket %"
                value={inputs.taxBracket}
                onChange={(v) => set("taxBracket", v)}
                placeholder="29"
              />
            </div>

            {/* Currency toggle pills */}
            <div className="flex gap-1 pb-0.5">
              {(["CAD", "USD"] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => set("currency", c)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    border: "1px solid",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    background: inputs.currency === c ? "#D4A853" : "transparent",
                    borderColor: inputs.currency === c ? "#D4A853" : "#3D2E26",
                    color: inputs.currency === c ? "#2C2420" : "#8B6E52",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Business trip toggle */}
          <div>
            <label
              className="flex items-center gap-3 cursor-pointer"
              htmlFor="business-toggle"
            >
              {/* Toggle switch */}
              <div
                style={{
                  position: "relative",
                  width: "2.5rem",
                  height: "1.375rem",
                  borderRadius: "9999px",
                  background: inputs.isBusiness ? "#D4A853" : "#3D2E26",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <input
                  id="business-toggle"
                  type="checkbox"
                  checked={inputs.isBusiness}
                  onChange={(e) => set("isBusiness", e.target.checked)}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                    margin: 0,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "0.1875rem",
                    left: inputs.isBusiness ? "1.1875rem" : "0.1875rem",
                    width: "1rem",
                    height: "1rem",
                    borderRadius: "50%",
                    background: "#FBF5ED",
                    transition: "left 0.2s",
                    pointerEvents: "none",
                  }}
                />
              </div>
              {/* text-base font-medium */}
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: inputs.isBusiness ? "#FBF5ED" : "#8B6E52",
                  transition: "color 0.15s",
                }}
              >
                Is this a business trip?
              </span>
            </label>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#6B5442",
                marginTop: "0.35rem",
                paddingLeft: "3.25rem",
                fontStyle: "italic",
              }}
            >
              Business trips can deduct 100% of expenses as a write-off
            </p>
          </div>

          {cur === "USD" && (
            <p style={{ fontSize: "0.73rem", color: "#6B5442", fontStyle: "italic" }}>
              Using approximate 1 CAD = 0.74 USD
            </p>
          )}
        </div>

        {/* Results section */}
        {showResults && (
          <>
            <div className="mb-5 h-px" style={{ background: "#3D2E26" }} />

            {/* Accommodation Savings — comparison stays unchanged (uses public vs member) */}
            <div className="mb-4">
              <p style={sectionLabelStyle}>Accommodation Savings</p>
              <ResultRow
                label="Public rate"
                value={`${fmt(publicPrice, cur)} ${cur}`}
              />
              <ResultRow
                label="Member rate"
                value={`${fmt(memberPrice, cur)} ${cur}`}
              />
              {/* "You save" — text-lg font-bold */}
              <div
                className="flex items-baseline justify-between mt-1 pt-2"
                style={{ borderTop: "1px solid #3D2E26" }}
              >
                <span style={{ color: "#D4A853", fontSize: "1.125rem", fontWeight: 700 }}>
                  You save
                </span>
                <span style={{ color: "#D4A853", fontSize: "1.125rem", fontWeight: 700 }}>
                  {fmt(accommodationSavings, cur)} {cur}
                  {publicPrice > 0 && (
                    <span style={{ fontSize: "0.85rem", fontWeight: 400, marginLeft: "0.35rem" }}>
                      ({accommodationSavingsPercent.toFixed(0)}%)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="mb-4 h-px" style={{ background: "#3D2E26" }} />

            {/* Total Trip Cost — uses member accommodation rate */}
            <div className="mb-4">
              <p style={sectionLabelStyle}>Total Trip Cost</p>
              {airlines > 0 && (
                <ResultRow label="Airline tickets" value={`${fmt(airlines, cur)} ${cur}`} />
              )}
              {transportation > 0 && (
                <ResultRow label="Transportation" value={`${fmt(transportation, cur)} ${cur}`} />
              )}
              {food > 0 && (
                <ResultRow label="Food & beverages" value={`${fmt(food, cur)} ${cur}`} />
              )}
              {entertainment > 0 && (
                <ResultRow label="Entertainment" value={`${fmt(entertainment, cur)} ${cur}`} />
              )}
              {memberPrice > 0 && (
                <ResultRow label="Accommodation (member rate)" value={`${fmt(memberPrice, cur)} ${cur}`} />
              )}
              {/* Subtotal — text-lg font-semibold */}
              <div
                className="flex items-baseline justify-between mt-1 pt-2"
                style={{ borderTop: "1px solid #3D2E26" }}
              >
                <span style={{ color: "#FBF5ED", fontSize: "1.125rem", fontWeight: 600 }}>
                  Subtotal
                </span>
                <span style={{ color: "#FBF5ED", fontSize: "1.125rem", fontWeight: 600 }}>
                  {fmt(totalTripCost, cur)} {cur}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="mb-4 h-px" style={{ background: "#3D2E26" }} />

            {/* Personal vs Business outcome */}
            {!inputs.isBusiness ? (
              <div className="mb-4">
                <ResultRow
                  label="Member savings"
                  value={`${fmt(accommodationSavings, cur)} ${cur}`}
                />
                <div
                  className="flex items-baseline justify-between mt-1 pt-2"
                  style={{ borderTop: "1px solid #3D2E26" }}
                >
                  <span style={{ color: "#FBF5ED", fontSize: "1.125rem", fontWeight: 600 }}>
                    Grand total with member rates
                  </span>
                  <span style={{ color: "#FBF5ED", fontSize: "1.125rem", fontWeight: 600 }}>
                    {fmt(totalTripCost, cur)} {cur}
                  </span>
                </div>
                <p style={{ fontSize: "0.73rem", color: "#6B5442", fontStyle: "italic", marginTop: "0.4rem" }}>
                  After-tax dollars spent
                </p>
              </div>
            ) : (
              <div className="mb-4 space-y-1">
                <ResultRow
                  label="Member savings"
                  value={`${fmt(accommodationSavings, cur)} ${cur}`}
                />
                <ResultRow
                  label="Tax deductible expenses"
                  value={`${fmt(totalTripCost, cur)} ${cur}`}
                />
                {/* Tax savings — text-lg font-bold, terracotta */}
                <div className="flex items-baseline justify-between pt-1">
                  <span style={{ color: "#C17A4A", fontSize: "1.125rem", fontWeight: 700 }}>
                    Tax savings at {taxBracket}%
                  </span>
                  <span style={{ color: "#C17A4A", fontSize: "1.125rem", fontWeight: 700 }}>
                    {fmt(taxSavings, cur)} {cur}
                  </span>
                </div>
                {/* Grand total benefit — text-xl font-bold, champagne gold */}
                <div
                  className="flex items-baseline justify-between pt-2 mt-1"
                  style={{ borderTop: "1px solid #3D2E26" }}
                >
                  <span style={{ color: "#D4A853", fontSize: "1.25rem", fontWeight: 700 }}>
                    Grand total benefit
                  </span>
                  <span style={{ color: "#D4A853", fontSize: "1.25rem", fontWeight: 700 }}>
                    {fmt(grandTotalBenefit, cur)} {cur}
                  </span>
                </div>
                <p style={{ fontSize: "0.73rem", color: "#6B5442", fontStyle: "italic", marginTop: "0.25rem" }}>
                  Deduct 100% of trip expenses from your business income
                </p>
              </div>
            )}
          </>
        )}

        {/* Divider */}
        <div className="mb-4 mt-2 h-px" style={{ background: "#3D2E26" }} />

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={reset}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "0.75rem",
              fontSize: "0.88rem",
              fontWeight: 500,
              letterSpacing: "0.06em",
              background: "transparent",
              border: "1px solid #3D2E26",
              color: "#8B6E52",
              cursor: "pointer",
              transition: "border-color 0.15s, color 0.15s",
              fontFamily: "var(--font-heading)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#6B5442";
              e.currentTarget.style.color = "#C4A882";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#3D2E26";
              e.currentTarget.style.color = "#8B6E52";
            }}
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2,
              padding: "0.75rem",
              borderRadius: "0.75rem",
              fontSize: "0.88rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              background: "#D4A853",
              border: "1px solid #D4A853",
              color: "#2C2420",
              cursor: "pointer",
              transition: "background 0.15s",
              fontFamily: "var(--font-heading)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#C4973D";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#D4A853";
            }}
          >
            Save this trip
          </button>
        </div>
      </div>
    </div>
  );
}
