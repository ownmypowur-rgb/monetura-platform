import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import {
  getDb,
  moneturaEvents,
  moneturaEventRegistrations,
} from "@monetura/db";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  eventId: z.number().int().positive(),
});

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = getDb();

  const events = await db
    .select({ id: moneturaEvents.id })
    .from(moneturaEvents)
    .where(
      and(
        eq(moneturaEvents.id, body.eventId),
        eq(moneturaEvents.isPublished, true)
      )
    )
    .limit(1);

  if (!events[0]) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    await db.insert(moneturaEventRegistrations).values({
      eventId: body.eventId,
      memberId: session.user.memberId,
    });
  } catch (err) {
    // Unique (event_id, member_id) — an existing registration is a success.
    const message = err instanceof Error ? err.message : "";
    if (!message.includes("Duplicate entry")) {
      console.error("[events/register] insert error:", err);
      return NextResponse.json(
        { error: "Could not register — please try again." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true, registered: true });
}
