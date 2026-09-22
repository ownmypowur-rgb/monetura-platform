import "server-only";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import {
  deductCredit,
  getDb,
  INSUFFICIENT_CREDITS,
  moneturaTripJournalEntries,
  refundCredit,
} from "@monetura/db";
import { getMemberJournalEntry, getTripExpensesOnDate, parseId } from "@/lib/trips/server";
import { TRIPS_MODEL, logAnthropicError, messageText } from "@/lib/trips/ai";
import {
  CATEGORY_LABELS,
  EVIDENCE_LABELS,
  PAYMENT_METHOD_LABELS,
  SUMMARY_CREDIT_COST,
} from "@/lib/trips/constants";
import type { MemberTier } from "@/types/next-auth";

export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ id: string; entryId: string }>;
}

// Rules are the brief's, verbatim in substance. Deliberately NOT given the
// trip's stated business purpose: the model may use only what the member said
// in this entry and in that day's expense records, so it cannot attach a
// purpose the member did not state for the day.
const SYSTEM_PROMPT = `You rewrite a traveller's own daily notes into a clear, professional, first-person daily business log that they can hand to their accountant.

Rules — follow all of them:
1. Write in the first person ("I met…", "I travelled…"), past tense, plain professional English. Short paragraphs; no headings, bullet points, or sign-off.
2. Include what was done, where, who was met, and the business purpose — but only as the member stated them.
3. Keep every amount, currency, name, time and place exactly as given. Do not round, convert, translate, re-spell or reformat them.
4. Never add facts. Never infer or suggest a business purpose that was not stated. If the member did not say why something was done, do not supply a reason.
5. If anything is unclear, garbled, or contradictory, write [unclear] in its place rather than guessing.
6. Never state or imply that anything is deductible, claimable, a write-off, or has any tax treatment. Do not mention taxes, CRA, or deductions at all, even if the member did.
7. The expense records are context written by the member. You may mention an expense only in the member's terms (vendor, amount, currency, purpose as recorded). Do not invent a connection between an expense and an activity that the member did not make.
8. Output only the log text.`;

// Last line of defence for rule 6. A summary that trips this is discarded and
// refunded rather than shown.
const TAX_LANGUAGE = /\b(deductib\w*|tax[- ]deduct\w*|write[- ]?offs?|written off|claimable|tax[- ]exempt)\b/i;

export async function POST(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId, memberTier } = session.user;
  const p = await params;
  const tripId = parseId(p.id);
  const entryId = parseId(p.entryId);
  const entry = tripId && entryId ? await getMemberJournalEntry(memberId, tripId, entryId) : null;
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const transcript = entry.transcriptStatus === "completed" ? entry.transcript?.trim() ?? "" : "";
  const rawText = entry.rawText?.trim() ?? "";
  if (!transcript && !rawText) {
    return NextResponse.json(
      { error: "There's nothing to summarize yet — wait for the transcript, or type your notes." },
      { status: 400 }
    );
  }

  const expenses = await getTripExpensesOnDate(memberId, entry.tripId, entry.entryDate);
  const expenseLines = expenses.map((e) => {
    const parts = [
      `vendor: ${e.vendorName}`,
      `category: ${CATEGORY_LABELS[e.category]}`,
      `amount: ${e.amount} ${e.currency}`,
      e.currency !== "CAD" ? `CAD: ${e.cadAmount}` : null,
      `paid by: ${PAYMENT_METHOD_LABELS[e.paymentMethod]}`,
      `evidence: ${EVIDENCE_LABELS[e.evidenceType]}`,
      e.description ? `description: ${e.description}` : null,
      e.businessPurpose ? `business purpose as recorded: ${e.businessPurpose}` : null,
    ].filter(Boolean);
    return `- ${parts.join("; ")}`;
  });

  const userContent = [
    `Date of this entry: ${entry.entryDate}`,
    "",
    "<member_voice_transcript>",
    transcript || "(none)",
    "</member_voice_transcript>",
    "",
    "<member_typed_notes>",
    rawText || "(none)",
    "</member_typed_notes>",
    "",
    "<expenses_recorded_this_day>",
    expenseLines.length ? expenseLines.join("\n") : "(none)",
    "</expenses_recorded_this_day>",
    "",
    "Write the daily business log.",
  ].join("\n");

  // ── Debit BEFORE the paid call; refund on every failure path ──────────────
  const referenceId = `trip-journal-${entry.id}-summary-${Date.now()}`;
  let creditsRemaining: number;
  try {
    creditsRemaining = await deductCredit(
      memberId,
      memberTier as MemberTier,
      "AI journal summary",
      referenceId,
      SUMMARY_CREDIT_COST
    );
  } catch (err) {
    if (err instanceof Error && err.message === INSUFFICIENT_CREDITS) {
      return NextResponse.json({ error: "No AI credits remaining this month", creditsRemaining: 0 }, { status: 402 });
    }
    console.error("[trips/summarize] Credit deduction failed:", err);
    return NextResponse.json({ error: "Summary failed" }, { status: 500 });
  }
  const fail = async (why: string) => {
    await refundCredit(memberId, `Refund — ${why}`, referenceId, SUMMARY_CREDIT_COST);
    return NextResponse.json(
      { error: "Couldn't write the summary — you weren't charged. Please try again." },
      { status: 502 }
    );
  };

  let message: Anthropic.Message;
  try {
    message = await new Anthropic().messages.create({
      model: TRIPS_MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });
  } catch (err) {
    logAnthropicError("trips/summarize", err);
    return fail("summary request failed");
  }
  if (message.stop_reason === "refusal") {
    console.error("[trips/summarize] Model refused. content=", JSON.stringify(message.content));
    return fail("model declined the request");
  }
  const summary = messageText(message).trim();
  if (!summary) return fail("summary was empty");
  if (message.stop_reason === "max_tokens") return fail("summary was cut off");
  if (TAX_LANGUAGE.test(summary)) {
    console.error("[trips/summarize] Discarded a summary containing tax language for entry", entry.id);
    return fail("summary broke the no-tax-language rule");
  }

  // Originals (raw_text, transcript, audio) are not in this update — by design.
  const now = new Date();
  await getDb()
    .update(moneturaTripJournalEntries)
    .set({
      aiSummary: summary,
      summaryStatus: "generated",
      summaryGeneratedAt: now,
      // Keep the first AI version forever; later generations only replace ai_summary.
      ...(entry.aiSummaryFirst ? {} : { aiSummaryFirst: summary }),
    })
    .where(and(eq(moneturaTripJournalEntries.id, entry.id), eq(moneturaTripJournalEntries.memberId, memberId)));

  return NextResponse.json({ success: true, summary, creditsRemaining });
}
