import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, moneturaMediaUploads } from "@monetura/db";

const bodySchema = z.object({
  mediaUploadId: z.number().int().positive(),
});

export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId } = session.user;

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // ── Fetch upload record (verifying ownership) ─────────────────────────────
  const rows = await getDb()
    .select({ publicUrl: moneturaMediaUploads.publicUrl })
    .from(moneturaMediaUploads)
    .where(
      and(
        eq(moneturaMediaUploads.id, body.mediaUploadId),
        eq(moneturaMediaUploads.uploaderId, memberId)
      )
    )
    .limit(1);

  const record = rows[0];
  if (!record) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  // ── Update status to uploaded ─────────────────────────────────────────────
  await getDb()
    .update(moneturaMediaUploads)
    .set({ status: "uploaded" })
    .where(
      and(
        eq(moneturaMediaUploads.id, body.mediaUploadId),
        eq(moneturaMediaUploads.uploaderId, memberId)
      )
    );

  return NextResponse.json({
    success: true,
    publicUrl: record.publicUrl,
  });
}
