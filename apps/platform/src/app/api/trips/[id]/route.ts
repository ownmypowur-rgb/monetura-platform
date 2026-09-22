import "server-only";
import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { auth } from "@/auth";
import {
  getDb,
  moneturaTrips,
  moneturaTripExpenses,
  moneturaTripAttachments,
  moneturaTripJournalEntries,
} from "@monetura/db";
import {
  firstIssue,
  getMemberTrip,
  parseId,
  resolveTripPercent,
  tripInputSchema,
} from "@/lib/trips/server";
import { deleteTripObject, getTripS3 } from "@/lib/trips/s3";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId } = session.user;
  const tripId = parseId((await params).id);
  if (!tripId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const trip = await getMemberTrip(memberId, tripId);
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = tripInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  // Existing expenses keep the business-use % they were saved with; only new
  // expenses pick up a changed trip default.
  await getDb()
    .update(moneturaTrips)
    .set({
      name: input.name,
      destinations: input.destinations,
      startDate: input.startDate,
      endDate: input.endDate,
      businessPurpose: input.businessPurpose,
      tripType: input.tripType,
      businessUsePercent: resolveTripPercent(input),
      notes: input.notes || null,
    })
    .where(and(eq(moneturaTrips.id, tripId), eq(moneturaTrips.memberId, memberId)));

  return NextResponse.json({ success: true });
}

/**
 * Only an empty trip can be deleted. A trip with records must have its
 * expenses and journal entries deleted one by one, each behind the six-year
 * retention warning — so a single tap can never wipe a whole trip's records.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId } = session.user;
  const tripId = parseId((await params).id);
  if (!tripId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const trip = await getMemberTrip(memberId, tripId);
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [expenses] = await getDb()
    .select({ n: count() })
    .from(moneturaTripExpenses)
    .where(and(eq(moneturaTripExpenses.tripId, tripId), eq(moneturaTripExpenses.memberId, memberId)));
  const attachments = await getDb()
    .select()
    .from(moneturaTripAttachments)
    .where(and(eq(moneturaTripAttachments.tripId, tripId), eq(moneturaTripAttachments.memberId, memberId)));

  const [journal] = await getDb()
    .select({ n: count() })
    .from(moneturaTripJournalEntries)
    .where(and(eq(moneturaTripJournalEntries.tripId, tripId), eq(moneturaTripJournalEntries.memberId, memberId)));

  if (
    Number(expenses?.n ?? 0) > 0 ||
    Number(journal?.n ?? 0) > 0 ||
    attachments.some((a) => a.journalEntryId !== null)
  ) {
    return NextResponse.json(
      { error: "Delete this trip's expenses and journal entries first." },
      { status: 409 }
    );
  }

  // What remains are unlinked leftovers (photos taken but never saved).
  const s3 = getTripS3();
  if (s3) {
    await Promise.all(attachments.map((a) => deleteTripObject(s3, a.s3Bucket, a.s3Key)));
  }
  await getDb()
    .delete(moneturaTripAttachments)
    .where(and(eq(moneturaTripAttachments.tripId, tripId), eq(moneturaTripAttachments.memberId, memberId)));
  await getDb()
    .delete(moneturaTrips)
    .where(and(eq(moneturaTrips.id, tripId), eq(moneturaTrips.memberId, memberId)));

  return NextResponse.json({ success: true });
}
