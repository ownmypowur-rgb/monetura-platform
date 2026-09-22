import "server-only";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, moneturaTripAttachments } from "@monetura/db";
import { getMemberAttachment, parseId } from "@/lib/trips/server";
import { getTripS3, headTripObject } from "@/lib/trips/s3";

interface RouteContext {
  params: Promise<{ attachmentId: string }>;
}

/** Marks an attachment uploaded — only after S3 confirms the object exists. */
export async function POST(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId } = session.user;
  const attachmentId = parseId((await params).attachmentId);
  const attachment = attachmentId ? await getMemberAttachment(memberId, attachmentId) : null;
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const s3 = getTripS3();
  if (!s3) return NextResponse.json({ error: "Storage service not configured" }, { status: 500 });

  const size = await headTripObject(s3, attachment.s3Bucket, attachment.s3Key);
  if (size === null) {
    return NextResponse.json({ error: "Upload not found in storage — please try again" }, { status: 409 });
  }

  await getDb()
    .update(moneturaTripAttachments)
    .set({ status: "uploaded", uploadedAt: new Date(), fileSizeBytes: size })
    .where(
      and(eq(moneturaTripAttachments.id, attachment.id), eq(moneturaTripAttachments.memberId, memberId))
    );

  return NextResponse.json({ success: true, attachmentId: attachment.id });
}
