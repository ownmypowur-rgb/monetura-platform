// Decimal-safe money helpers for Trip Records.
//
// Amounts, rates and CAD values are handled as scaled BigInts so a stored
// record is exactly reproducible — no binary floating point touches a value
// that ends up in the ledger or an accountant export.
//
// Scales: original amount = 3 decimals (covers KWD/BHD/OMR), exchange rate = 8
// decimals, CAD = 2 decimals (cents). Matches the column definitions in
// drizzle/monetura-schema.ts.

// BigInt() calls rather than 0n literals: the app tsconfig targets < ES2020.
export const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const TEN = BigInt(10);

export const AMOUNT_SCALE = 3;
export const RATE_SCALE = 8;
export const CAD_SCALE = 2;

/** Parses a plain non-negative decimal string ("12", "12.5") into a scaled BigInt. */
export function parseScaled(value: string, scale: number): bigint | null {
  const match = /^(\d{1,12})(?:\.(\d+))?$/.exec(value.trim());
  if (!match) return null;
  const whole = match[1] ?? "0";
  const frac = match[2] ?? "";
  if (frac.length > scale) return null;
  return BigInt(whole + frac.padEnd(scale, "0"));
}

/** Formats a scaled BigInt as a fixed decimal string ("12.500"). */
export function formatScaled(value: bigint, scale: number): string {
  const negative = value < ZERO;
  const digits = (negative ? -value : value).toString().padStart(scale + 1, "0");
  const whole = digits.slice(0, digits.length - scale);
  const frac = digits.slice(digits.length - scale);
  return `${negative ? "-" : ""}${whole}${scale > 0 ? `.${frac}` : ""}`;
}

/** Integer division rounding half away from zero (inputs are non-negative here). */
function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * TWO + denominator) / (denominator * TWO);
}

export const pow10 = (n: number): bigint => {
  let result = ONE;
  for (let i = 0; i < n; i++) result *= TEN;
  return result;
};

/** CAD cents = amount × rate, rounded half-up to the cent. */
export function cadFromRate(amountScaled: bigint, rateScaled: bigint): bigint {
  return divRoundHalfUp(
    amountScaled * rateScaled,
    pow10(AMOUNT_SCALE + RATE_SCALE - CAD_SCALE)
  );
}

/** Implied rate = CAD ÷ amount, to 8 decimals (card-statement entries). */
export function rateFromCad(amountScaled: bigint, cadScaled: bigint): bigint {
  return divRoundHalfUp(
    cadScaled * pow10(RATE_SCALE + AMOUNT_SCALE - CAD_SCALE),
    amountScaled
  );
}

/** Converts a DB decimal string (any scale ≤ target) to a scaled BigInt; 0n on junk. */
export function decimalToScaled(value: string | null | undefined, scale: number): bigint {
  if (!value) return ZERO;
  return parseScaled(value, scale) ?? ZERO;
}

/** Sums DB decimal strings exactly and returns the fixed string. */
export function sumDecimals(values: string[], scale: number): string {
  const total = values.reduce((acc, v) => acc + decimalToScaled(v, scale), ZERO);
  return formatScaled(total, scale);
}

/**
 * Display formatting. Uses Intl for the currency's own minor units (JPY shows
 * no decimals, KWD shows three); falls back to "123.45 XYZ" for codes Intl
 * does not recognise.
 */
export function formatMoney(value: string, currency: string): string {
  const n = Number(value);
  try {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
      currencyDisplay: currency === "CAD" ? "narrowSymbol" : "code",
    }).format(n);
  } catch {
    return `${value} ${currency}`;
  }
}

export function formatCad(value: string): string {
  return formatMoney(value, "CAD");
}

/** Trims trailing zeros from a stored rate for display ("1.37120000" → "1.3712"). */
export function formatRate(value: string): string {
  if (!value.includes(".")) return value;
  const trimmed = value.replace(/0+$/, "");
  return trimmed.endsWith(".") ? trimmed.slice(0, -1) : trimmed;
}
