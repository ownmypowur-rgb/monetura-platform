import "server-only";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, moneturaTripAttachments, moneturaTripJournalEntries } from "@monetura/db";
import {
  firstIssue,
  getLinkableAttachments,
  getMemberTrip,
  insertedId,
  journalCreateSchema,
  parseId,
} from "@/lib/trips/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId } = session.user;
  const tripId = parseId((await params).id);
  if (!tripId || !(await getMemberTrip(memberId, tripId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = journalCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  let audioId: number | null = null;
  if (input.audioAttachmentId) {
    const [audio] = await getLinkableAttachments(memberId, tripId, [input.audioAttachmentId]);
    if (!audio || audio.type !== "audio") {
      return NextResponse.json({ error: "Voice note not found — please record it again" }, { status: 400 });
    }
    audioId = audio.id;
  }

  try {
    const id = await getDb().transaction(async (tx) => {
      const result = await tx.insert(moneturaTripJournalEntries).values({
        memberId,
        tripId,
        entryDate: input.entryDate,
        rawText: input.rawText || null,
        audioAttachmentId: audioId,
      });
      const entryId = insertedId(result);
      if (audioId) {
        await tx
          .update(moneturaTripAttachments)
          .set({ journalEntryId: entryId })
          .where(and(eq(moneturaTripAttachments.id, audioId), eq(moneturaTripAttachments.memberId, memberId)));
      }
      return entryId;
    });
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("[trips/journal] Create failed:", err);
    return NextResponse.json({ error: "Could not save the entry" }, { status: 500 });
  }
}
