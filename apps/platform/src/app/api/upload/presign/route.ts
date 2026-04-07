import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/auth";
import { getDb, moneturaMediaUploads } from "@monetura/db";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const bodySchema = z.object({
  fileName: z.string().min(1).max(500),
  fileType: z.enum(ALLOWED_TYPES),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE, {
    message: "File size must be under 20MB",
  }),
});

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  console.log("[presign] POST called");
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.memberId) {
    console.log("[presign] Unauthorized — no session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId, id: userId } = session.user;
  console.log("[presign] memberId:", memberId);

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? err.errors[0]?.message ?? "Invalid request"
        : "Invalid request body";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // ── Env vars ──────────────────────────────────────────────────────────────
  const bucket = process.env["AWS_S3_BUCKET"];
  const region = process.env["AWS_REGION"];
  const accessKeyId = process.env["AWS_ACCESS_KEY_ID"];
  const secretAccessKey = process.env["AWS_SECRET_ACCESS_KEY"];
  const s3BaseUrl = process.env["NEXT_PUBLIC_S3_BASE_URL"];

  if (!bucket || !region || !accessKeyId || !secretAccessKey || !s3BaseUrl) {
    console.error("Missing AWS environment variables");
    return NextResponse.json(
      { error: "Storage service not configured" },
      { status: 500 }
    );
  }

  // ── Generate S3 key ───────────────────────────────────────────────────────
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2, 10);
  const safeFileName = sanitizeFileName(body.fileName);
  const s3Key = `monetura/members/${userId}/uploads/${timestamp}_${randomId}_${safeFileName}`;
  const publicUrl = `${s3BaseUrl}/${s3Key}`;

  // ── Create presigned PUT URL ──────────────────────────────────────────────
  const s3 = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: s3Key,
    ContentType: body.fileType,
    ContentLength: body.fileSize,
  });

  let uploadUrl: string;
  try {
    uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
  } catch (err) {
    console.error("S3 presign error:", err);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }

  // ── Insert pending DB record ──────────────────────────────────────────────
  let mediaUploadId: number;
  try {
    const result = await getDb().insert(moneturaMediaUploads).values({
      uploaderId: memberId,
      s3Key,
      s3Bucket: bucket,
      fileName: body.fileName,
      mimeType: body.fileType,
      fileSizeBytes: body.fileSize,
      publicUrl,
      status: "pending",
    });
    // Drizzle with mysql2 returns [ResultSetHeader, ...] — insertId is on index 0
    const [header] = result as unknown as [{ insertId: number | bigint }];
    mediaUploadId = Number(header.insertId);
  } catch (err) {
    console.error("DB insert error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  console.log("[presign] Success — mediaUploadId:", mediaUploadId, "key:", s3Key);
  return NextResponse.json({
    uploadUrl,
    s3Key,
    mediaUploadId,
    publicUrl,
  });
}
