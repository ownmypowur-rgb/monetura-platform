import "server-only";
import { z } from "zod";
import { and, asc, count, desc, eq, inArray, sum } from "drizzle-orm";
import {
  getDb,
  moneturaTrips,
  moneturaTripExpenses,
  moneturaTripAttachments,
  moneturaTripExpenseRevisions,
  TRIP_TYPES,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  EVIDENCE_TYPES,
} from "@monetura/db";
import { getBankOfCanadaRate } from "./fx";
import {
  AMOUNT_SCALE,
  CAD_SCALE,
  RATE_SCALE,
  ZERO,
  cadFromRate,
  decimalToScaled,
  formatScaled,
  pow10,
  parseScaled,
  rateFromCad,
} from "./money";
import type { RateSource } from "./constants";
import { MAX_EXPENSE_NOTE_LENGTH } from "./constants";

// ── Row types ────────────────────────────────────────────────────────────────

export type TripRow = typeof moneturaTrips.$inferSelect;
export type ExpenseRow = typeof moneturaTripExpenses.$inferSelect;
export type AttachmentRow = typeof moneturaTripAttachments.$inferSelect;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** mysql2 returns [ResultSetHeader, ...] from an insert; the new id is on index 0. */
export function insertedId(result: unknown): number {
  const [header] = result as [{ insertId: number | bigint }];
  const id = Number(header.insertId);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Insert returned no id");
  return id;
}

/** Exact comparison of two decimal strings at the given scale. */
export function sameDecimal(a: string, b: string, scale: number): boolean {
  return decimalToScaled(a, scale) === decimalToScaled(b, scale);
}

export function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date")
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Invalid date");

/**
 * Latest date an expense may carry. Members can be up to 14 hours ahead of
 * UTC (Pacific islands), so "tomorrow in UTC" is the earliest safe ceiling.
 */
export function latestAllowedDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ── Trip validation ──────────────────────────────────────────────────────────

export const tripInputSchema = z
  .object({
    name: z.string().trim().min(1, "Give the trip a name").max(255),
    destinations: z.string().trim().min(1, "Add at least one destination").max(500),
    startDate: isoDate,
    endDate: isoDate,
    businessPurpose: z
      .string()
      .trim()
      .min(1, "Business purpose is required")
      .max(5000),
    tripType: z.enum(TRIP_TYPES),
    businessUsePercent: z.number().int().min(0).max(100).nullable().optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.endDate < v.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be on or after the start date",
      });
    }
    if (v.tripType === "mixed") {
      const pct = v.businessUsePercent;
      if (pct === null || pct === undefined || pct < 1 || pct > 99) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["businessUsePercent"],
          message: "Mixed trips need a business-use percentage between 1 and 99",
        });
      }
    }
  });

export type TripInput = z.infer<typeof tripInputSchema>;

/** Business → 100 unless given; mixed → as given (validated); personal → 0 unless given. */
export function resolveTripPercent(input: TripInput): number {
  if (input.tripType === "mixed") return input.businessUsePercent ?? 50;
  if (input.businessUsePercent !== null && input.businessUsePercent !== undefined) {
    return input.businessUsePercent;
  }
  return input.tripType === "business" ? 100 : 0;
}

// ── Expense validation ───────────────────────────────────────────────────────

const decimalString = (scale: number, label: string) =>
  z
    .string()
    .trim()
    .refine((v) => {
      const parsed = parseScaled(v, scale);
      return parsed !== null && parsed > ZERO;
    }, `${label} must be a positive number with at most ${scale} decimals`);

export const fxChoiceSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("boc") }),
  z.object({ mode: z.literal("member_rate"), rate: decimalString(RATE_SCALE, "Rate") }),
  z.object({ mode: z.literal("card_statement"), cadAmount: decimalString(CAD_SCALE, "CAD amount") }),
  // Edit only: keep the stored rate and CAD amount untouched.
  z.object({ mode: z.literal("keep") }),
]);

export type FxChoice = z.infer<typeof fxChoiceSchema>;

export const expenseInputSchema = z
  .object({
    expenseDate: isoDate,
    vendorName: z.string().trim().min(1, "Vendor name is required").max(255),
    description: z.string().trim().max(MAX_EXPENSE_NOTE_LENGTH).nullable().optional(),
    category: z.enum(EXPENSE_CATEGORIES),
    amount: decimalString(AMOUNT_SCALE, "Amount"),
    currency: z
      .string()
      .trim()
      .transform((v) => v.toUpperCase())
      .refine((v) => /^[A-Z]{3}$/.test(v), "Use a 3-letter ISO currency code"),
    fx: fxChoiceSchema,
    paymentMethod: z.enum(PAYMENT_METHODS),
    evidenceType: z.enum(EVIDENCE_TYPES),
    vendorSignerName: z.string().trim().max(255).nullable().optional(),
    businessPurpose: z.string().trim().max(MAX_EXPENSE_NOTE_LENGTH).nullable().optional(),
    businessUsePercent: z.number().int().min(0).max(100),
    aiAssisted: z.boolean().optional(),
    attachmentIds: z.array(z.number().int().positive()).max(20).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.expenseDate > latestAllowedDate()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expenseDate"],
        message: "Expense date can't be in the future",
      });
    }
    if (v.evidenceType !== "official_receipt") {
      if (!v.description) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["description"],
          message: "Describe what was bought when there is no official receipt",
        });
      }
      if (!v.businessPurpose) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["businessPurpose"],
          message: "Business purpose is required when there is no official receipt",
        });
      }
    }
    if (v.evidenceType === "vendor_signature" && !v.vendorSignerName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["vendorSignerName"],
        message: "Add the name of the person who signed",
      });
    }
  });

export type ExpenseInput = z.infer<typeof expenseInputSchema>;

export function firstIssue(err: z.ZodError): string {
  const issue = err.errors[0];
  return issue?.message ?? "Invalid request";
}

// ── FX resolution (server is the only source of stored rates) ───────────────

export type FxResolution =
  | {
      ok: true;
      exchangeRate: string;
      rateSource: RateSource;
      rateDate: string | null;
      cadAmount: string;
    }
  | { ok: false; status: number; error: string; code: "RATE_REQUIRED" | "RATE_UNAVAILABLE" | "INVALID" };

export async function resolveFx(
  amount: string,
  currency: string,
  expenseDate: string,
  fx: Exclude<FxChoice, { mode: "keep" }>
): Promise<FxResolution> {
  const amountScaled = parseScaled(amount, AMOUNT_SCALE);
  if (amountScaled === null || amountScaled <= ZERO) {
    return { ok: false, status: 400, error: "Invalid amount", code: "INVALID" };
  }

  if (currency === "CAD") {
    return {
      ok: true,
      exchangeRate: formatScaled(pow10(RATE_SCALE), RATE_SCALE),
      rateSource: "not_required",
      rateDate: null,
      cadAmount: formatScaled(cadFromRate(amountScaled, pow10(RATE_SCALE)), CAD_SCALE),
    };
  }

  if (fx.mode === "member_rate") {
    const rate = parseScaled(fx.rate, RATE_SCALE);
    if (rate === null || rate <= ZERO) {
      return { ok: false, status: 400, error: "Invalid rate", code: "INVALID" };
    }
    return {
      ok: true,
      exchangeRate: formatScaled(rate, RATE_SCALE),
      rateSource: "member_entered",
      rateDate: null,
      cadAmount: formatScaled(cadFromRate(amountScaled, rate), CAD_SCALE),
    };
  }

  if (fx.mode === "card_statement") {
    const cad = parseScaled(fx.cadAmount, CAD_SCALE);
    if (cad === null || cad <= ZERO) {
      return { ok: false, status: 400, error: "Invalid CAD amount", code: "INVALID" };
    }
    return {
      ok: true,
      exchangeRate: formatScaled(rateFromCad(amountScaled, cad), RATE_SCALE),
      rateSource: "card_statement",
      rateDate: null,
      cadAmount: formatScaled(cad, CAD_SCALE),
    };
  }

  const boc = await getBankOfCanadaRate(currency, expenseDate);
  if (boc.kind === "not_published") {
    return {
      ok: false,
      status: 422,
      code: "RATE_REQUIRED",
      error: `The Bank of Canada does not publish a rate for ${currency}. Enter the rate, or the CAD amount from your card statement.`,
    };
  }
  if (boc.kind === "unavailable") {
    return {
      ok: false,
      status: 503,
      code: "RATE_UNAVAILABLE",
      error: "The Bank of Canada rate service didn't respond. Try again, or enter the rate or card-statement amount yourself.",
    };
  }
  const rate = parseScaled(boc.rate, RATE_SCALE);
  if (rate === null) {
    return { ok: false, status: 503, code: "RATE_UNAVAILABLE", error: "Unexpected rate format from the Bank of Canada" };
  }
  return {
    ok: true,
    exchangeRate: formatScaled(rate, RATE_SCALE),
    rateSource: "bank_of_canada",
    rateDate: boc.rateDate,
    cadAmount: formatScaled(cadFromRate(amountScaled, rate), CAD_SCALE),
  };
}

// ── Queries (every one filtered by member) ───────────────────────────────────

export async function getMemberTrip(memberId: number, tripId: number): Promise<TripRow | null> {
  const rows = await getDb()
    .select()
    .from(moneturaTrips)
    .where(and(eq(moneturaTrips.id, tripId), eq(moneturaTrips.memberId, memberId)))
    .limit(1);
  return rows[0] ?? null;
}

export interface TripListItem extends TripRow {
  totalCad: string;
  expenseCount: number;
}

export async function listMemberTrips(memberId: number): Promise<TripListItem[]> {
  const trips = await getDb()
    .select()
    .from(moneturaTrips)
    .where(eq(moneturaTrips.memberId, memberId))
    .orderBy(desc(moneturaTrips.startDate), desc(moneturaTrips.id));
  if (trips.length === 0) return [];

  const totals = await getDb()
    .select({
      tripId: moneturaTripExpenses.tripId,
      total: sum(moneturaTripExpenses.cadAmount),
      n: count(),
    })
    .from(moneturaTripExpenses)
    .where(eq(moneturaTripExpenses.memberId, memberId))
    .groupBy(moneturaTripExpenses.tripId);
  const byTrip = new Map(totals.map((t) => [t.tripId, t]));

  return trips.map((trip) => {
    const t = byTrip.get(trip.id);
    return {
      ...trip,
      totalCad: t?.total ?? "0.00",
      expenseCount: Number(t?.n ?? 0),
    };
  });
}

export async function getTripExpenses(memberId: number, tripId: number): Promise<ExpenseRow[]> {
  return getDb()
    .select()
    .from(moneturaTripExpenses)
    .where(
      and(eq(moneturaTripExpenses.memberId, memberId), eq(moneturaTripExpenses.tripId, tripId))
    )
    .orderBy(asc(moneturaTripExpenses.expenseDate), asc(moneturaTripExpenses.id));
}

export async function getMemberExpense(
  memberId: number,
  tripId: number,
  expenseId: number
): Promise<ExpenseRow | null> {
  const rows = await getDb()
    .select()
    .from(moneturaTripExpenses)
    .where(
      and(
        eq(moneturaTripExpenses.id, expenseId),
        eq(moneturaTripExpenses.memberId, memberId),
        eq(moneturaTripExpenses.tripId, tripId)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function getTripAttachments(memberId: number, tripId: number): Promise<AttachmentRow[]> {
  return getDb()
    .select()
    .from(moneturaTripAttachments)
    .where(
      and(
        eq(moneturaTripAttachments.memberId, memberId),
        eq(moneturaTripAttachments.tripId, tripId),
        eq(moneturaTripAttachments.status, "uploaded")
      )
    )
    .orderBy(asc(moneturaTripAttachments.id));
}

export async function getMemberAttachment(
  memberId: number,
  attachmentId: number
): Promise<AttachmentRow | null> {
  const rows = await getDb()
    .select()
    .from(moneturaTripAttachments)
    .where(
      and(
        eq(moneturaTripAttachments.id, attachmentId),
        eq(moneturaTripAttachments.memberId, memberId)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Loads attachments the member wants to link to a new record: they must be
 * theirs, on this trip, uploaded, and not already linked to anything.
 */
export async function getLinkableAttachments(
  memberId: number,
  tripId: number,
  ids: number[]
): Promise<AttachmentRow[]> {
  if (ids.length === 0) return [];
  const rows = await getDb()
    .select()
    .from(moneturaTripAttachments)
    .where(
      and(
        inArray(moneturaTripAttachments.id, ids),
        eq(moneturaTripAttachments.memberId, memberId),
        eq(moneturaTripAttachments.tripId, tripId),
        eq(moneturaTripAttachments.status, "uploaded")
      )
    );
  return rows.filter((r) => r.expenseId === null && r.journalEntryId === null);
}

export async function getRevisionCounts(
  memberId: number,
  expenseIds: number[]
): Promise<Map<number, number>> {
  if (expenseIds.length === 0) return new Map();
  const rows = await getDb()
    .select({ expenseId: moneturaTripExpenseRevisions.expenseId, n: count() })
    .from(moneturaTripExpenseRevisions)
    .where(
      and(
        eq(moneturaTripExpenseRevisions.memberId, memberId),
        inArray(moneturaTripExpenseRevisions.expenseId, expenseIds)
      )
    )
    .groupBy(moneturaTripExpenseRevisions.expenseId);
  return new Map(rows.map((r) => [r.expenseId, Number(r.n)]));
}

/** Snapshot of an expense row as plain JSON values, for the audit record. */
export function snapshotExpense(row: ExpenseRow): Record<string, string | number | boolean | null> {
  return {
    expenseDate: row.expenseDate,
    vendorName: row.vendorName,
    description: row.description,
    category: row.category,
    amount: row.amount,
    currency: row.currency,
    exchangeRate: row.exchangeRate,
    rateSource: row.rateSource,
    rateDate: row.rateDate,
    cadAmount: row.cadAmount,
    paymentMethod: row.paymentMethod,
    evidenceType: row.evidenceType,
    vendorSignerName: row.vendorSignerName,
    businessPurpose: row.businessPurpose,
    businessUsePercent: row.businessUsePercent,
    aiAssisted: row.aiAssisted,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Evidence types that need a specific kind of attachment to stand on. */
export function missingEvidence(
  input: Pick<ExpenseInput, "evidenceType">,
  attachments: Pick<AttachmentRow, "type">[]
): string | null {
  if (input.evidenceType === "vendor_signature" && !attachments.some((a) => a.type === "signature")) {
    return "Have the vendor sign on screen before saving.";
  }
  if (input.evidenceType === "vendor_note" && !attachments.some((a) => a.type === "vendor_note_photo")) {
    return "Add a photo of the vendor's handwritten note before saving.";
  }
  return null;
}

/** Edits made more than this long after creation keep an audit record. */
export const AUDIT_GRACE_MS = 24 * 60 * 60 * 1000;
