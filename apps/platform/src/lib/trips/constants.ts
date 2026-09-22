// Client-safe Trip Records vocabulary. Types come from the schema (type-only
// import, erased at build) so a new enum value there fails type-check here.
import type {
  TRIP_TYPES,
  EXPENSE_CATEGORIES,
  RATE_SOURCES,
  PAYMENT_METHODS,
  EVIDENCE_TYPES,
  ATTACHMENT_TYPES,
} from "@monetura/db";

export type TripType = (typeof TRIP_TYPES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type RateSource = (typeof RATE_SOURCES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];

/** Shown on every Trip Records page and on the PDF export. Wording is fixed. */
export const TRIP_RECORDS_DISCLAIMER =
  "Monetura organizes your records. Your tax professional determines what is deductible.";

/** Label only — nothing in the product calculates it. */
export const MEALS_FLAG = "50% rule may apply";

/** CRA's general retention period, stated before any record is deleted. */
export const RETENTION_WARNING =
  "Records should be kept for six years from the end of the tax year they relate to. Deleting this cannot be undone.";

export const VENDOR_NOTE_TIP =
  "Ask the vendor to write the date, item and amount, and sign.";

// Credit cost per AI action — see DECISIONS.md [Sprint 10] / [Sprint 11].
export const RECEIPT_READ_CREDIT_COST = 1;
export const TRANSCRIPTION_CREDIT_COST = 1;
export const SUMMARY_CREDIT_COST = 1;

export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  business: "Business",
  mixed: "Mixed business & personal",
  personal: "Personal",
};

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  airfare: "Airfare",
  lodging: "Lodging",
  meals: "Meals",
  ground_transport: "Ground transport",
  fees_admissions: "Fees & admissions",
  equipment_supplies: "Equipment & supplies",
  communications: "Communications",
  other: "Other",
};

export const RATE_SOURCE_LABELS: Record<RateSource, string> = {
  bank_of_canada: "Bank of Canada",
  member_entered: "Member entered",
  card_statement: "Card statement",
  not_required: "CAD — no conversion",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  other: "Other",
};

export const EVIDENCE_LABELS: Record<EvidenceType, string> = {
  official_receipt: "Official receipt",
  vendor_note: "Handwritten vendor note",
  vendor_signature: "Vendor signature",
  self_declared: "Self-declared (no receipt)",
};

export const ATTACHMENT_LABELS: Record<AttachmentType, string> = {
  receipt_photo: "Receipt photo",
  vendor_note_photo: "Vendor note photo",
  signature: "Vendor signature",
  audio: "Voice note",
};

export const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS) as ExpenseCategory[];
export const EVIDENCE_ORDER = Object.keys(EVIDENCE_LABELS) as EvidenceType[];
export const PAYMENT_ORDER = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];
export const TRIP_TYPE_ORDER = Object.keys(TRIP_TYPE_LABELS) as TripType[];

/**
 * Currencies offered in the picker: CAD first, then the Bank of Canada's
 * published series, then common travel currencies BoC does not publish (those
 * route the member to enter a rate or card-statement amount). Any other ISO
 * code can be typed via "Other".
 */
export const COMMON_CURRENCIES: string[] = [
  "CAD",
  // Published by the Bank of Canada (checked against the Valet series list, 2026-09-22)
  "USD", "EUR", "GBP", "MXN", "JPY", "AUD", "BRL", "CHF", "CNY", "HKD",
  "IDR", "INR", "KRW", "MYR", "NOK", "NZD", "PEN", "PLN", "SAR", "SEK",
  "SGD", "THB", "TRY", "TWD", "VND", "ZAR",
  // Not published — member enters a rate or the card-statement CAD amount
  "AED", "ARS", "CLP", "COP", "CRC", "CZK", "DKK", "DOP", "EGP", "HUF",
  "ILS", "ISK", "JMD", "KES", "MAD", "PHP", "QAR",
];

export const MAX_EXPENSE_NOTE_LENGTH = 2000;
