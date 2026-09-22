import "server-only";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import {
  deductCredit,
  getDb,
  INSUFFICIENT_CREDITS,
  moneturaTripJournalEntries,
  refundCredit,
} from "@monetura/db";
import { getMemberAttachment, getMemberJournalEntry, parseId } from "@/lib/trips/server";
import { getTripObjectBytes, getTripS3 } from "@/lib/trips/s3";
import { transcribeAudio, transcriptionEnabled } from "@/lib/trips/transcribe";
import { TRANSCRIPTION_CREDIT_COST } from "@/lib/trips/constants";
import type { MemberTier } from "@/types/next-auth";

export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ id: string; entryId: string }>;
}

/**
 * Transcribes the entry's voice note into `transcript` (verbatim). Without
 * OPENAI_API_KEY the audio stays saved, the entry is marked `not_enabled`,
 * nothing is charged, and the member is told to type instead.
 */
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
  if (!entry.audioAttachmentId) {
    return NextResponse.json({ error: "This entry has no voice note" }, { status: 400 });
  }
  if (entry.transcriptStatus === "completed") {
    return NextResponse.json({ status: "completed", transcript: entry.transcript });
  }

  const setStatus = (values: Partial<typeof moneturaTripJournalEntries.$inferInsert>) =>
    getDb()
      .update(moneturaTripJournalEntries)
      .set(values)
      .where(and(eq(moneturaTripJournalEntries.id, entry.id), eq(moneturaTripJournalEntries.memberId, memberId)));

  if (!transcriptionEnabled()) {
    await setStatus({ transcriptStatus: "not_enabled" });
    return NextResponse.json({ status: "not_enabled" });
  }

  const audio = await getMemberAttachment(memberId, entry.audioAttachmentId);
  const s3 = getTripS3();
  if (!audio || audio.status !== "uploaded" || !s3) {
    return NextResponse.json({ error: "Voice note not found in storage" }, { status: 404 });
  }

  // Load audio before charging — a storage failure costs nothing.
  let bytes: Uint8Array;
  try {
    bytes = await getTripObjectBytes(s3, audio.s3Bucket, audio.s3Key);
  } catch (err) {
    console.error("[trips/transcribe] S3 read failed:", err);
    return NextResponse.json({ error: "Couldn't load the voice note — please try again" }, { status: 502 });
  }

  const referenceId = `trip-journal-${entry.id}-transcribe-${Date.now()}`;
  try {
    await deductCredit(memberId, memberTier as MemberTier, "Voice note transcription", referenceId, TRANSCRIPTION_CREDIT_COST);
  } catch (err) {
    if (err instanceof Error && err.message === INSUFFICIENT_CREDITS) {
      return NextResponse.json(
        { error: "No AI credits remaining this month — you can type your entry instead.", creditsRemaining: 0 },
        { status: 402 }
      );
    }
    console.error("[trips/transcribe] Credit deduction failed:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }

  const result = await transcribeAudio(bytes, audio.mimeType);
  if (!result.ok) {
    console.error("[trips/transcribe] OpenAI transcription failed:", result.error);
    await refundCredit(memberId, "Refund — transcription failed", referenceId, TRANSCRIPTION_CREDIT_COST);
    await setStatus({ transcriptStatus: "failed" });
    return NextResponse.json(
      { status: "failed", error: "Transcription failed — your recording is saved. Try again, or type your entry." },
      { status: 502 }
    );
  }

  await setStatus({ transcript: result.text, transcriptStatus: "completed", transcribedAt: new Date() });
  return NextResponse.json({ status: "completed", transcript: result.text });
}
