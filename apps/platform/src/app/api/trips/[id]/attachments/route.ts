import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb, moneturaTripAttachments, ATTACHMENT_TYPES } from "@monetura/db";
import { firstIssue, getMemberTrip, insertedId, parseId } from "@/lib/trips/server";
import { getTripS3, presignTripPut, tripObjectKey } from "@/lib/trips/s3";
import type { AttachmentType } from "@/lib/trips/constants";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
// iOS Safari records audio/mp4 (AAC); Chrome/Firefox record audio/webm (Opus).
const AUDIO_TYPES = ["audio/mp4", "audio/webm", "audio/aac", "audio/mpeg", "audio/ogg", "audio/x-m4a"];

const ALLOWED: Record<AttachmentType, { mimes: string[]; maxBytes: number }> = {
  receipt_photo: { mimes: PHOTO_TYPES, maxBytes: 20 * 1024 * 1024 },
  vendor_note_photo: { mimes: PHOTO_TYPES, maxBytes: 20 * 1024 * 1024 },
  signature: { mimes: ["image/png"], maxBytes: 2 * 1024 * 1024 },
  // 25 MB is OpenAI's transcription upload ceiling; 10 minutes at the
  // recorder's 64 kbps is ~5 MB, so this is generous.
  audio: { mimes: AUDIO_TYPES, maxBytes: 25 * 1024 * 1024 },
};

const bodySchema = z.object({
  type: z.enum(ATTACHMENT_TYPES),
  fileName: z.string().trim().min(1).max(500),
  // Strip codec parameters: "audio/webm;codecs=opus" → "audio/webm".
  fileType: z.string().transform((v) => v.split(";")[0]?.trim().toLowerCase() ?? ""),
  fileSize: z.number().int().positive(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId, id: userId } = session.user;
  const tripId = parseId((await params).id);
  if (!tripId || !(await getMemberTrip(memberId, tripId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const body = parsed.data;
  const rule = ALLOWED[body.type];
  if (!rule.mimes.includes(body.fileType)) {
    return NextResponse.json({ error: `That file type can't be used for this attachment` }, { status: 400 });
  }
  if (body.fileSize > rule.maxBytes) {
    return NextResponse.json(
      { error: `File is too large (max ${Math.round(rule.maxBytes / 1024 / 1024)} MB)` },
      { status: 400 }
    );
  }

  const s3 = getTripS3();
  if (!s3) {
    console.error("[trips/attachments] Missing AWS environment variables");
    return NextResponse.json({ error: "Storage service not configured" }, { status: 500 });
  }

  const key = tripObjectKey(userId, tripId, body.fileName);
  let uploadUrl: string;
  try {
    uploadUrl = await presignTripPut(s3, key, body.fileType, body.fileSize);
  } catch (err) {
    console.error("[trips/attachments] Presign failed:", err);
    return NextResponse.json({ error: "Failed to prepare upload" }, { status: 500 });
  }

  try {
    const result = await getDb()
      .insert(moneturaTripAttachments)
      .values({
        memberId,
        tripId,
        type: body.type,
        s3Key: key,
        s3Bucket: s3.bucket,
        mimeType: body.fileType,
        originalFilename: body.fileName,
        fileSizeBytes: body.fileSize,
        status: "pending",
      });
    return NextResponse.json({
      attachmentId: insertedId(result),
      uploadUrl,
      contentType: body.fileType,
    });
  } catch (err) {
    console.error("[trips/attachments] DB insert failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
