import "server-only";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, moneturaTripAttachments } from "@monetura/db";
import { getMemberAttachment, parseId } from "@/lib/trips/server";
import { deleteTripObject, getTripS3, presignTripGet } from "@/lib/trips/s3";

interface RouteContext {
  params: Promise<{ attachmentId: string }>;
}

/**
 * Private read: redirects to a 5-minute presigned GET after an ownership check.
 * Usable directly as an <img>/<audio> src. `?download=1` asks S3 to serve it
 * as a file download.
 */
export async function GET(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const attachmentId = parseId((await params).attachmentId);
  const attachment = attachmentId
    ? await getMemberAttachment(session.user.memberId, attachmentId)
    : null;
  if (!attachment || attachment.status !== "uploaded") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const s3 = getTripS3();
  if (!s3) return NextResponse.json({ error: "Storage service not configured" }, { status: 500 });

  const download = new URL(request.url).searchParams.get("download") === "1";
  const url = await presignTripGet(
    s3,
    attachment.s3Bucket,
    attachment.s3Key,
    download ? attachment.originalFilename : undefined
  );
  const res = NextResponse.redirect(url, 302);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

/**
 * Removes an attachment that has not been saved to a record yet (a photo
 * retaken before saving). Once linked to an expense or journal entry an
 * attachment is part of the record and goes only when that record is deleted.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId } = session.user;
  const attachmentId = parseId((await params).attachmentId);
  const attachment = attachmentId ? await getMemberAttachment(memberId, attachmentId) : null;
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (attachment.expenseId !== null || attachment.journalEntryId !== null) {
    return NextResponse.json(
      { error: "This file is part of a saved record and can't be removed on its own." },
      { status: 409 }
    );
  }

  const s3 = getTripS3();
  if (s3) await deleteTripObject(s3, attachment.s3Bucket, attachment.s3Key);
  await getDb()
    .delete(moneturaTripAttachments)
    .where(
      and(eq(moneturaTripAttachments.id, attachment.id), eq(moneturaTripAttachments.memberId, memberId))
    );
  return NextResponse.json({ success: true });
}
