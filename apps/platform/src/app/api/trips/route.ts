import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, moneturaTrips } from "@monetura/db";
import { firstIssue, insertedId, resolveTripPercent, tripInputSchema } from "@/lib/trips/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId } = session.user;

  const parsed = tripInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  try {
    const result = await getDb()
      .insert(moneturaTrips)
      .values({
        memberId,
        name: input.name,
        destinations: input.destinations,
        startDate: input.startDate,
        endDate: input.endDate,
        businessPurpose: input.businessPurpose,
        tripType: input.tripType,
        businessUsePercent: resolveTripPercent(input),
        notes: input.notes || null,
      });
    return NextResponse.json({ success: true, id: insertedId(result) });
  } catch (err) {
    console.error("[trips] Create failed:", err);
    return NextResponse.json({ error: "Could not save the trip" }, { status: 500 });
  }
}
