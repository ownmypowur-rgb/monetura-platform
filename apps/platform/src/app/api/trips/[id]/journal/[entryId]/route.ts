import "server-only";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, moneturaTripAttachments, moneturaTripJournalEntries } from "@monetura/db";
import {
  firstIssue,
  getLinkableAttachments,
  getMemberJournalEntry,
  journalUpdateSchema,
  parseId,
} from "@/lib/trips/server";
import { deleteTripObject, getTripS3 } from "@/lib/trips/s3";

interface RouteContext {
  params: Promise<{ id: string; entryId: string }>;
}

async function load(params: RouteContext["params"], memberId: number) {
  const p = await params;
  const tripId = parseId(p.id);
  const entryId = parseId(p.entryId);
  if (!tripId || !entryId) return null;
  return getMemberJournalEntry(memberId, tripId, entryId);
}

/**
 * Member edits: the entry date, their own typed notes, their edit of the AI
 * summary, or attaching a first voice note. The verbatim transcript and an
 * existing recording can't be changed here. The first AI summary is never
 * touched — an edit writes `ai_summary` only.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId } = session.user;
  const entry = await load(params, memberId);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = journalUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  const updates: Partial<typeof moneturaTripJournalEntries.$inferInsert> = {};
  if (input.entryDate !== undefined) updates.entryDate = input.entryDate;
  if (input.rawText !== undefined) updates.rawText = input.rawText || null;
  if (input.aiSummary !== undefined) {
    if (entry.summaryStatus === "none") {
      return NextResponse.json({ error: "Generate a summary first" }, { status: 409 });
    }
    updates.aiSummary = input.aiSummary;
    updates.summaryStatus = "edited";
    updates.summaryEditedAt = new Date();
  }

  let audioId: number | null = null;
  if (input.audioAttachmentId !== undefined) {
    if (entry.audioAttachmentId !== null) {
      return NextResponse.json({ error: "This entry already has a voice note" }, { status: 409 });
    }
    const [audio] = await getLinkableAttachments(memberId, entry.tripId, [input.audioAttachmentId]);
    if (!audio || audio.type !== "audio") {
      return NextResponse.json({ error: "Voice note not found — please record it again" }, { status: 400 });
    }
    audioId = audio.id;
    updates.audioAttachmentId = audio.id;
    updates.transcriptStatus = "none";
  }

  // An entry must keep some original content.
  const nextRaw = updates.rawText !== undefined ? updates.rawText : entry.rawText;
  if (!nextRaw && !entry.audioAttachmentId && !audioId) {
    return NextResponse.json({ error: "An entry needs typed notes or a voice note" }, { status: 400 });
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ success: true });

  await getDb().transaction(async (tx) => {
    await tx
      .update(moneturaTripJournalEntries)
      .set(updates)
      .where(and(eq(moneturaTripJournalEntries.id, entry.id), eq(moneturaTripJournalEntries.memberId, memberId)));
    if (audioId) {
      await tx
        .update(moneturaTripAttachments)
        .set({ journalEntryId: entry.id })
        .where(and(eq(moneturaTripAttachments.id, audioId), eq(moneturaTripAttachments.memberId, memberId)));
    }
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId } = session.user;
  const entry = await load(params, memberId);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const files = await getDb()
    .select()
    .from(moneturaTripAttachments)
    .where(and(eq(moneturaTripAttachments.journalEntryId, entry.id), eq(moneturaTripAttachments.memberId, memberId)));

  await getDb().transaction(async (tx) => {
    await tx
      .delete(moneturaTripAttachments)
      .where(and(eq(moneturaTripAttachments.journalEntryId, entry.id), eq(moneturaTripAttachments.memberId, memberId)));
    await tx
      .delete(moneturaTripJournalEntries)
      .where(and(eq(moneturaTripJournalEntries.id, entry.id), eq(moneturaTripJournalEntries.memberId, memberId)));
  });

  const s3 = getTripS3();
  if (s3) await Promise.all(files.map((f) => deleteTripObject(s3, f.s3Bucket, f.s3Key)));
  return NextResponse.json({ success: true });
}
