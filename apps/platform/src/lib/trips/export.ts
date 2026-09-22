import "server-only";
import { and, asc, eq, gte, inArray, lte, or } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { zipSync, strToU8, type Zippable } from "fflate";
import {
  getDb,
  moneturaTrips,
  moneturaTripExpenses,
  moneturaTripAttachments,
  moneturaTripJournalEntries,
} from "@monetura/db";
import {
  getRevisionCounts,
  type AttachmentRow,
  type ExpenseRow,
  type JournalRow,
  type TripRow,
} from "./server";
import {
  AI_SUMMARY_LABEL,
  ATTACHMENT_LABELS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  EVIDENCE_LABELS,
  MEALS_FLAG,
  PAYMENT_METHOD_LABELS,
  RATE_SOURCE_LABELS,
  TRIP_RECORDS_DISCLAIMER,
  TRIP_TYPE_LABELS,
  type AttachmentType,
} from "./constants";
import { CAD_SCALE, formatRate, sumDecimals } from "./money";
import { getTripObjectBytes, type getTripS3 } from "./s3";

// ── Loading ──────────────────────────────────────────────────────────────────

export type ExportScope = { kind: "trip"; trip: TripRow } | { kind: "year"; year: number };

export interface ExportBundle {
  scope: ExportScope;
  memberName: string;
  title: string;
  fileBase: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: Date;
  trips: TripRow[];
  expenses: ExpenseRow[];
  journal: JournalRow[];
  attachments: AttachmentRow[];
  revisionCounts: Map<number, number>;
  /** Path inside the ZIP for every attachment, by attachment id. */
  zipPaths: Map<number, string>;
}

function slug(value: string, max = 40): string {
  const s = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
  return s || "item";
}

/** "84.500" → "84.50"; "1250.125" stays. */
function shortAmount(amount: string): string {
  return /\.\d\d0$/.test(amount) ? amount.slice(0, -1) : amount;
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/aac": "aac",
};

const FILE_TYPE_WORD: Record<AttachmentType, string> = {
  receipt_photo: "receipt",
  vendor_note_photo: "vendor-note",
  signature: "signature",
  audio: "voice-note",
};

function buildZipPaths(expenses: ExpenseRow[], journal: JournalRow[], attachments: AttachmentRow[]): Map<number, string> {
  const paths = new Map<number, string>();
  const used = new Set<string>();
  const expenseById = new Map(expenses.map((e) => [e.id, e]));
  const entryById = new Map(journal.map((j) => [j.id, j]));
  for (const a of attachments) {
    const ext = EXTENSIONS[a.mimeType] ?? "bin";
    let base: string;
    const expense = a.expenseId !== null ? expenseById.get(a.expenseId) : undefined;
    const entry = a.journalEntryId !== null ? entryById.get(a.journalEntryId) : undefined;
    if (expense) {
      base = `attachments/${expense.expenseDate}_${slug(expense.vendorName)}_${shortAmount(expense.amount)}${expense.currency}_${FILE_TYPE_WORD[a.type]}`;
    } else if (entry) {
      base = `journal/${entry.entryDate}_journal-${entry.id}_${FILE_TYPE_WORD[a.type]}`;
    } else {
      continue;
    }
    let path = `${base}.${ext}`;
    for (let n = 2; used.has(path); n++) path = `${base}-${n}.${ext}`;
    used.add(path);
    paths.set(a.id, path);
  }
  return paths;
}

export async function loadExportBundle(
  memberId: number,
  memberName: string,
  scope: ExportScope
): Promise<ExportBundle> {
  const db = getDb();
  let trips: TripRow[];
  let expenses: ExpenseRow[];
  let journal: JournalRow[];
  let periodStart: string;
  let periodEnd: string;
  let title: string;
  let fileBase: string;

  if (scope.kind === "trip") {
    const t = scope.trip;
    trips = [t];
    [expenses, journal] = await Promise.all([
      db.select().from(moneturaTripExpenses)
        .where(and(eq(moneturaTripExpenses.memberId, memberId), eq(moneturaTripExpenses.tripId, t.id)))
        .orderBy(asc(moneturaTripExpenses.expenseDate), asc(moneturaTripExpenses.id)),
      db.select().from(moneturaTripJournalEntries)
        .where(and(eq(moneturaTripJournalEntries.memberId, memberId), eq(moneturaTripJournalEntries.tripId, t.id)))
        .orderBy(asc(moneturaTripJournalEntries.entryDate), asc(moneturaTripJournalEntries.id)),
    ]);
    periodStart = t.startDate;
    periodEnd = t.endDate;
    title = t.name;
    fileBase = `monetura-trip-${slug(t.name, 30)}-${t.startDate}`;
  } else {
    periodStart = `${scope.year}-01-01`;
    periodEnd = `${scope.year}-12-31`;
    [expenses, journal] = await Promise.all([
      db.select().from(moneturaTripExpenses)
        .where(and(
          eq(moneturaTripExpenses.memberId, memberId),
          gte(moneturaTripExpenses.expenseDate, periodStart),
          lte(moneturaTripExpenses.expenseDate, periodEnd)
        ))
        .orderBy(asc(moneturaTripExpenses.expenseDate), asc(moneturaTripExpenses.id)),
      db.select().from(moneturaTripJournalEntries)
        .where(and(
          eq(moneturaTripJournalEntries.memberId, memberId),
          gte(moneturaTripJournalEntries.entryDate, periodStart),
          lte(moneturaTripJournalEntries.entryDate, periodEnd)
        ))
        .orderBy(asc(moneturaTripJournalEntries.entryDate), asc(moneturaTripJournalEntries.id)),
    ]);
    // Trips that overlap the year, plus any trip whose records fall in it
    // (e.g. airfare paid in December for a January trip).
    const recordTripIds = Array.from(new Set([...expenses.map((e) => e.tripId), ...journal.map((j) => j.tripId)]));
    trips = await db.select().from(moneturaTrips)
      .where(and(
        eq(moneturaTrips.memberId, memberId),
        or(
          and(lte(moneturaTrips.startDate, periodEnd), gte(moneturaTrips.endDate, periodStart)),
          recordTripIds.length > 0 ? inArray(moneturaTrips.id, recordTripIds) : undefined
        )
      ))
      .orderBy(asc(moneturaTrips.startDate), asc(moneturaTrips.id));
    title = `Tax year ${scope.year}`;
    fileBase = `monetura-trip-records-${scope.year}`;
  }

  const expenseIds = expenses.map((e) => e.id);
  const entryIds = journal.map((j) => j.id);
  const attachments =
    expenseIds.length + entryIds.length === 0
      ? []
      : await db.select().from(moneturaTripAttachments)
          .where(and(
            eq(moneturaTripAttachments.memberId, memberId),
            eq(moneturaTripAttachments.status, "uploaded"),
            or(
              expenseIds.length ? inArray(moneturaTripAttachments.expenseId, expenseIds) : undefined,
              entryIds.length ? inArray(moneturaTripAttachments.journalEntryId, entryIds) : undefined
            )
          ))
          .orderBy(asc(moneturaTripAttachments.id));

  return {
    scope,
    memberName,
    title,
    fileBase,
    periodStart,
    periodEnd,
    generatedAt: new Date(),
    trips,
    expenses,
    journal,
    attachments,
    revisionCounts: await getRevisionCounts(memberId, expenseIds),
    zipPaths: buildZipPaths(expenses, journal, attachments),
  };
}

function filesFor(bundle: ExportBundle, expenseId: number): string[] {
  return bundle.attachments
    .filter((a) => a.expenseId === expenseId)
    .map((a) => bundle.zipPaths.get(a.id))
    .filter((p): p is string => Boolean(p));
}

// ── CSV ──────────────────────────────────────────────────────────────────────

const CSV_COLUMNS = [
  "trip_id", "trip_name", "expense_id", "expense_date", "vendor_name", "description", "category",
  "category_label", "category_flag", "amount", "currency", "exchange_rate_cad_per_unit", "rate_source",
  "rate_date", "cad_amount", "payment_method", "evidence_type", "vendor_signer_name", "business_purpose",
  "business_use_percent", "ai_assisted", "edited_after_24h_count", "created_at", "updated_at", "files",
] as const;

function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // Spreadsheet formula-injection guard for free-text fields.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv(bundle: ExportBundle): string {
  const tripName = new Map(bundle.trips.map((t) => [t.id, t.name]));
  const lines = [CSV_COLUMNS.join(",")];
  for (const e of bundle.expenses) {
    const row: Record<(typeof CSV_COLUMNS)[number], string | number | boolean | null> = {
      trip_id: e.tripId,
      trip_name: tripName.get(e.tripId) ?? "",
      expense_id: e.id,
      expense_date: e.expenseDate,
      vendor_name: e.vendorName,
      description: e.description,
      category: e.category,
      category_label: CATEGORY_LABELS[e.category],
      category_flag: e.category === "meals" ? MEALS_FLAG : "",
      amount: e.amount,
      currency: e.currency,
      exchange_rate_cad_per_unit: e.exchangeRate,
      rate_source: e.rateSource,
      rate_date: e.rateDate,
      cad_amount: e.cadAmount,
      payment_method: e.paymentMethod,
      evidence_type: e.evidenceType,
      vendor_signer_name: e.vendorSignerName,
      business_purpose: e.businessPurpose,
      business_use_percent: e.businessUsePercent,
      ai_assisted: e.aiAssisted ? "yes" : "no",
      edited_after_24h_count: bundle.revisionCounts.get(e.id) ?? 0,
      created_at: e.createdAt.toISOString(),
      updated_at: e.updatedAt.toISOString(),
      files: filesFor(bundle, e.id).join(" | "),
    };
    lines.push(CSV_COLUMNS.map((c) => csvCell(row[c])).join(","));
  }
  // BOM so Excel opens UTF-8 (accented vendor names) correctly.
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

// ── PDF ──────────────────────────────────────────────────────────────────────

const PAGE_W = 612; // US Letter
const PAGE_H = 792;
const MARGIN = 50;
const FOOTER_SPACE = 46;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = rgb(0x2c / 255, 0x24 / 255, 0x20 / 255);
const MUTED = rgb(0x6b / 255, 0x5a / 255, 0x48 / 255);
const GOLD = rgb(0xa8 / 255, 0x7f / 255, 0x2e / 255);
const RULE = rgb(0xe8 / 255, 0xdc / 255, 0xcb / 255);
const SHADE = rgb(0xfb / 255, 0xf5 / 255, 0xed / 255);
const UNRENDERABLE = "[…]";

interface TextOpts {
  size?: number;
  bold?: boolean;
  color?: RGB;
  indent?: number;
  /** split() only: inset of the right-aligned part from the right margin. */
  rightIndent?: number;
  after?: number;
}

/**
 * Minimal flowing-text writer on top of pdf-lib. Standard fonts are
 * WinAnsi-encoded: characters outside it (e.g. CJK, Thai) are replaced — with
 * the unaccented letter when one exists, otherwise "[…]" per run. The CSV keeps
 * the full original text. See DECISIONS.md [Sprint 11].
 */
class PdfWriter {
  page!: PDFPage;
  y = 0;
  private charCache = new Map<string, string>();

  constructor(
    readonly doc: PDFDocument,
    readonly regular: PDFFont,
    readonly bold: PDFFont
  ) {
    this.newPage();
  }

  newPage(): void {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  ensure(height: number): void {
    if (this.y - height < MARGIN + FOOTER_SPACE) this.newPage();
  }

  /** Maps text into the font's WinAnsi set. Each run of characters it can't
   *  draw (e.g. Japanese, Thai) becomes one "[…]"; accented letters it lacks
   *  fall back to the unaccented letter. */
  safe(text: string): string {
    let out = "";
    let inGap = false;
    for (const ch of text) {
      let mapped = this.charCache.get(ch);
      if (mapped === undefined) {
        mapped = "";
        try {
          this.regular.encodeText(ch);
          mapped = ch;
        } catch {
          const base = ch.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
          if (base && base !== ch) {
            try {
              this.regular.encodeText(base);
              mapped = base;
            } catch {
              /* unrenderable */
            }
          }
        }
        this.charCache.set(ch, mapped);
      }
      if (mapped === "") {
        if (!inGap) out += UNRENDERABLE;
        inGap = true;
      } else {
        out += mapped;
        inGap = false;
      }
    }
    return out;
  }

  width(text: string, size: number, bold = false): number {
    return (bold ? this.bold : this.regular).widthOfTextAtSize(text, size);
  }

  wrap(text: string, size: number, maxWidth: number, bold = false): string[] {
    const lines: string[] = [];
    for (const para of this.safe(text.replace(/\t/g, "  ")).split(/\r?\n/)) {
      if (para.trim() === "") {
        lines.push("");
        continue;
      }
      let line = "";
      for (const word of para.split(/ +/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (this.width(candidate, size, bold) <= maxWidth) {
          line = candidate;
          continue;
        }
        if (line) lines.push(line);
        // Break a single over-long word.
        let rest = word;
        while (this.width(rest, size, bold) > maxWidth) {
          let cut = rest.length - 1;
          while (cut > 1 && this.width(rest.slice(0, cut), size, bold) > maxWidth) cut--;
          lines.push(rest.slice(0, cut));
          rest = rest.slice(cut);
        }
        line = rest;
      }
      lines.push(line);
    }
    return lines;
  }

  text(text: string, opts: TextOpts = {}): void {
    const size = opts.size ?? 10;
    const indent = opts.indent ?? 0;
    const lineH = size * 1.38;
    for (const line of this.wrap(text, size, CONTENT_W - indent, opts.bold)) {
      this.ensure(lineH);
      if (line) {
        this.page.drawText(line, {
          x: MARGIN + indent,
          y: this.y - size,
          size,
          font: opts.bold ? this.bold : this.regular,
          color: opts.color ?? INK,
        });
      }
      this.y -= lineH;
    }
    this.y -= opts.after ?? 0;
  }

  /** One line with a left part and a right-aligned part (truncates the left). */
  split(left: string, right: string, opts: TextOpts = {}): void {
    const size = opts.size ?? 10;
    const lineH = size * 1.38;
    this.ensure(lineH);
    const font = opts.bold ? this.bold : this.regular;
    const r = this.safe(right);
    const rWidth = font.widthOfTextAtSize(r, size);
    let l = this.safe(left);
    const rightIndent = opts.rightIndent ?? 0;
    const maxLeft = CONTENT_W - (opts.indent ?? 0) - rightIndent - rWidth - 12;
    while (l.length > 1 && font.widthOfTextAtSize(l, size) > maxLeft) l = `${l.slice(0, -2)}…`;
    const baseline = this.y - size;
    this.page.drawText(l, { x: MARGIN + (opts.indent ?? 0), y: baseline, size, font, color: opts.color ?? INK });
    this.page.drawText(r, { x: PAGE_W - MARGIN - rightIndent - rWidth, y: baseline, size, font, color: opts.color ?? INK });
    this.y -= lineH + (opts.after ?? 0);
  }

  rule(after = 8): void {
    this.ensure(4);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_W - MARGIN, y: this.y },
      thickness: 0.75,
      color: RULE,
    });
    this.y -= after;
  }

  band(label: string, right: string): void {
    const size = 10;
    this.ensure(size * 2.4);
    this.page.drawRectangle({ x: MARGIN, y: this.y - size * 1.7, width: CONTENT_W, height: size * 1.9, color: SHADE });
    this.y -= size * 0.25;
    this.split(label, right, { size, bold: true, indent: 6, rightIndent: 6 });
    this.y -= size * 0.6;
  }

  space(h: number): void {
    this.y -= h;
  }

  heading(text: string): void {
    this.ensure(40);
    this.text(text.toUpperCase(), { size: 8, bold: true, color: GOLD, after: 2 });
  }
}

function dayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(d);
}

function money(amount: string, currency: string): string {
  const n = Number(amount);
  try {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency, currencyDisplay: "code" }).format(n);
  } catch {
    return `${amount} ${currency}`;
  }
}

const cad = (v: string) => money(v, "CAD");

export async function buildPdf(bundle: ExportBundle): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Trip Records — ${bundle.title}`);
  doc.setAuthor(bundle.memberName);
  doc.setProducer("Monetura");
  doc.setCreator("Monetura Trip Records");
  const w = new PdfWriter(doc, await doc.embedFont(StandardFonts.Helvetica), await doc.embedFont(StandardFonts.HelveticaBold));
  const tripName = new Map(bundle.trips.map((t) => [t.id, t.name]));
  const total = sumDecimals(bundle.expenses.map((e) => e.cadAmount), CAD_SCALE);

  // ── Cover ────────────────────────────────────────────────────────────────
  w.text("MONETURA · TRIP RECORDS", { size: 9, bold: true, color: GOLD, after: 10 });
  w.text(bundle.title, { size: 24, bold: true, after: 4 });
  w.text(
    bundle.scope.kind === "trip"
      ? `${dayLabel(bundle.periodStart)} – ${dayLabel(bundle.periodEnd)}`
      : `All trips · January 1 – December 31, ${bundle.scope.year}`,
    { size: 11, color: MUTED, after: 18 }
  );
  w.split("Prepared for", bundle.memberName, { size: 11 });
  w.split("Generated", bundle.generatedAt.toLocaleString("en-CA", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }) + " UTC", { size: 11 });
  w.split("Expenses", `${bundle.expenses.length} · ${cad(total)} total`, { size: 11 });
  w.split("Journal entries", String(bundle.journal.length), { size: 11 });
  w.split("Files (photos, signatures, voice notes)", String(bundle.attachments.length), { size: 11, after: 14 });
  w.rule(14);

  for (const t of bundle.trips) {
    w.heading(bundle.scope.kind === "trip" ? "Trip" : "Trip in this period");
    w.text(t.name, { size: 14, bold: true, after: 2 });
    w.text(`${dayLabel(t.startDate)} – ${dayLabel(t.endDate)}`, { size: 10, color: MUTED });
    w.text(`Destinations: ${t.destinations}`, { size: 10 });
    w.text(`Trip type: ${TRIP_TYPE_LABELS[t.tripType]} · Business use: ${t.businessUsePercent}% (member's estimate)`, { size: 10, after: 4 });
    w.text("Business purpose (member's words)", { size: 9, bold: true, color: MUTED });
    w.text(t.businessPurpose, { size: 10, after: 4 });
    if (t.notes) {
      w.text("Notes", { size: 9, bold: true, color: MUTED });
      w.text(t.notes, { size: 10, after: 4 });
    }
    w.space(10);
  }

  w.heading("How to read this package");
  for (const note of [
    "Amounts are shown in the original currency and in CAD. The exchange rate stored with each expense is the one used when it was recorded; it never changes afterwards.",
    "Rate sources: Bank of Canada = the Bank of Canada daily average rate (the rate date is the latest published on or before the expense date); Card statement = the CAD amount the member copied from their card statement; Member entered = a rate the member typed; CAD — no conversion = the expense was in CAD.",
    "CAD totals are the full recorded amounts. Business-use percentages are the member's own estimates, listed per expense and not applied to any total.",
    `Meals are labelled "${MEALS_FLAG}". This is a label only.`,
    "Evidence shows what supports each expense: an official receipt, a handwritten vendor note, a vendor's on-screen signature, or the member's own declaration.",
    "AI-assisted means fields were prefilled from a receipt photo by AI and each one was confirmed by the member before saving. Edited after 24h means the expense was changed more than a day after it was recorded; the original values are retained in Monetura.",
    `Journal entries show the "${AI_SUMMARY_LABEL}" first, with the verbatim transcript and the member's typed notes beneath it.`,
    `Text in scripts this PDF's font cannot display (for example Japanese or Thai) appears as ${UNRENDERABLE}. The CSV keeps every name and note exactly as entered.`,
  ]) {
    w.text(`• ${note}`, { size: 9, color: MUTED, indent: 0, after: 3 });
  }

  // ── Ledger ───────────────────────────────────────────────────────────────
  w.newPage();
  w.text("Expense ledger", { size: 18, bold: true, after: 10 });
  if (bundle.expenses.length === 0) {
    w.text("No expenses recorded for this period.", { size: 10, color: MUTED });
  }
  const byDay = new Map<string, ExpenseRow[]>();
  for (const e of bundle.expenses) byDay.set(e.expenseDate, [...(byDay.get(e.expenseDate) ?? []), e]);
  for (const [day, rows] of Array.from(byDay.entries())) {
    w.band(dayLabel(day), cad(sumDecimals(rows.map((r) => r.cadAmount), CAD_SCALE)));
    for (const e of rows) {
      w.ensure(60);
      w.split(e.vendorName, cad(e.cadAmount), { size: 10, bold: true, indent: 6 });
      const conversion =
        e.rateSource === "not_required"
          ? money(e.amount, e.currency)
          : `${money(e.amount, e.currency)} × ${formatRate(e.exchangeRate)} (${RATE_SOURCE_LABELS[e.rateSource]}${e.rateDate ? `, rate of ${e.rateDate}` : ""})`;
      const facts = [
        `${CATEGORY_LABELS[e.category]}${e.category === "meals" ? ` — ${MEALS_FLAG}` : ""}`,
        conversion,
        `Paid: ${PAYMENT_METHOD_LABELS[e.paymentMethod]}`,
        `Evidence: ${EVIDENCE_LABELS[e.evidenceType]}${e.vendorSignerName ? ` (signed by ${e.vendorSignerName})` : ""}`,
        `${e.businessUsePercent}% business use`,
        e.aiAssisted ? "AI-assisted" : null,
        (bundle.revisionCounts.get(e.id) ?? 0) > 0 ? `Edited after 24h (${bundle.revisionCounts.get(e.id)})` : null,
        bundle.scope.kind === "year" ? `Trip: ${tripName.get(e.tripId) ?? e.tripId}` : null,
      ].filter(Boolean);
      w.text(facts.join(" · "), { size: 8.5, color: MUTED, indent: 6 });
      if (e.description) w.text(`Description: ${e.description}`, { size: 8.5, indent: 6 });
      if (e.businessPurpose) w.text(`Business purpose: ${e.businessPurpose}`, { size: 8.5, indent: 6 });
      const files = filesFor(bundle, e.id);
      if (files.length) w.text(`Files: ${files.join(", ")}`, { size: 8, color: MUTED, indent: 6 });
      w.space(7);
    }
    w.space(4);
  }

  // ── Totals ───────────────────────────────────────────────────────────────
  w.ensure(160);
  w.space(8);
  w.text("CAD totals by category", { size: 14, bold: true, after: 6 });
  for (const category of CATEGORY_ORDER) {
    const rows = bundle.expenses.filter((e) => e.category === category);
    if (rows.length === 0) continue;
    w.split(
      `${CATEGORY_LABELS[category]} (${rows.length})${category === "meals" ? ` — ${MEALS_FLAG}` : ""}`,
      cad(sumDecimals(rows.map((r) => r.cadAmount), CAD_SCALE)),
      { size: 10, indent: 6 }
    );
  }
  w.rule(6);
  w.split("Total", cad(total), { size: 11, bold: true, indent: 6, after: 4 });
  w.text("Full recorded CAD amounts. Business-use percentages are not applied.", { size: 8.5, color: MUTED, indent: 6 });

  // ── Journal ──────────────────────────────────────────────────────────────
  w.newPage();
  w.text("Daily journal", { size: 18, bold: true, after: 10 });
  if (bundle.journal.length === 0) {
    w.text("No journal entries recorded for this period.", { size: 10, color: MUTED });
  }
  for (const j of bundle.journal) {
    w.band(dayLabel(j.entryDate), bundle.scope.kind === "year" ? tripName.get(j.tripId) ?? "" : "");
    if (j.aiSummary) {
      w.text(`${AI_SUMMARY_LABEL}${j.summaryStatus === "edited" ? " — edited by the member" : ""}`, { size: 8.5, bold: true, color: GOLD, indent: 6 });
      w.text(j.aiSummary, { size: 10, indent: 6, after: 6 });
    }
    if (j.transcriptStatus === "completed" && j.transcript) {
      w.text("Verbatim transcript", { size: 8.5, bold: true, color: MUTED, indent: 6 });
      w.text(j.transcript, { size: 9, indent: 6, after: 6 });
    } else if (j.audioAttachmentId) {
      w.text("Verbatim transcript: not available — the voice recording is included in the ZIP.", { size: 8.5, color: MUTED, indent: 6, after: 6 });
    }
    if (j.rawText) {
      w.text("Member's typed notes", { size: 8.5, bold: true, color: MUTED, indent: 6 });
      w.text(j.rawText, { size: 9, indent: 6, after: 6 });
    }
    const audio = bundle.attachments.find((a) => a.id === j.audioAttachmentId);
    const audioPath = audio ? bundle.zipPaths.get(audio.id) : undefined;
    if (audioPath) w.text(`Voice recording: ${audioPath}`, { size: 8, color: MUTED, indent: 6 });
    w.space(8);
  }

  // ── Footer on every page ─────────────────────────────────────────────────
  const pages = doc.getPages();
  const disclaimer = w.safe(TRIP_RECORDS_DISCLAIMER);
  pages.forEach((page, i) => {
    const dW = w.regular.widthOfTextAtSize(disclaimer, 8);
    page.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: PAGE_W - MARGIN, y: 42 }, thickness: 0.5, color: RULE });
    page.drawText(disclaimer, { x: (PAGE_W - dW) / 2, y: 30, size: 8, font: w.regular, color: INK });
    const left = w.safe(`${bundle.memberName} · ${bundle.title}`);
    page.drawText(left.length > 70 ? `${left.slice(0, 69)}…` : left, { x: MARGIN, y: 18, size: 7, font: w.regular, color: MUTED });
    const num = `Page ${i + 1} of ${pages.length}`;
    page.drawText(num, { x: PAGE_W - MARGIN - w.regular.widthOfTextAtSize(num, 7), y: 18, size: 7, font: w.regular, color: MUTED });
  });

  return doc.save();
}

// ── ZIP ──────────────────────────────────────────────────────────────────────

export async function buildZip(
  bundle: ExportBundle,
  s3: NonNullable<ReturnType<typeof getTripS3>>
): Promise<Uint8Array> {
  const [pdf, csv] = [await buildPdf(bundle), buildCsv(bundle)];
  const files: Zippable = {
    [`${bundle.fileBase}.pdf`]: [pdf, { level: 6 }],
    [`${bundle.fileBase}-expenses.csv`]: [strToU8(csv), { level: 6 }],
  };

  const missing: string[] = [];
  const queue = bundle.attachments.filter((a) => bundle.zipPaths.has(a.id));
  const CONCURRENCY = 6;
  let next = 0;
  async function worker() {
    while (next < queue.length) {
      const a = queue[next++];
      if (!a) break;
      const path = bundle.zipPaths.get(a.id);
      if (!path) continue;
      try {
        // Photos and audio are already compressed — store them as-is.
        files[path] = [await getTripObjectBytes(s3, a.s3Bucket, a.s3Key), { level: 0 }];
      } catch (err) {
        console.error(`[trips/export] Could not fetch ${a.s3Key}:`, err);
        missing.push(`${path} (${ATTACHMENT_LABELS[a.type]})`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));

  if (missing.length > 0) {
    files["MISSING-FILES.txt"] = strToU8(
      `These files could not be retrieved when this package was built. Export again, or contact Monetura support.\r\n\r\n${missing.join("\r\n")}\r\n`
    );
  }
  return zipSync(files);
}
