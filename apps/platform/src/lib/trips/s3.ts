import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Trip Records media lives in the same bucket as post media (AWS_S3_BUCKET,
// monetura-platform-media) under a per-member trips/ prefix, using the same
// presign → browser PUT → confirm pattern as /api/upload/*.
//
// Unlike post photos, receipts, signatures and voice notes are private: they
// are never given a public URL. Every read goes through a short-lived presigned
// GET issued after a member-ownership check. See DECISIONS.md [Sprint 10].

interface S3Config {
  client: S3Client;
  bucket: string;
}

let _config: S3Config | null = null;

export function getTripS3(): S3Config | null {
  if (_config) return _config;
  const bucket = process.env["AWS_S3_BUCKET"];
  const region = process.env["AWS_REGION"];
  const accessKeyId = process.env["AWS_ACCESS_KEY_ID"];
  const secretAccessKey = process.env["AWS_SECRET_ACCESS_KEY"];
  if (!bucket || !region || !accessKeyId || !secretAccessKey) return null;
  _config = {
    bucket,
    client: new S3Client({ region, credentials: { accessKeyId, secretAccessKey } }),
  };
  return _config;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

export function tripObjectKey(userId: string, tripId: number, fileName: string): string {
  const randomId = Math.random().toString(36).slice(2, 10);
  return `monetura/members/${userId}/trips/${tripId}/${Date.now()}_${randomId}_${sanitizeFileName(fileName)}`;
}

export async function presignTripPut(
  s3: S3Config,
  key: string,
  contentType: string,
  contentLength: number
): Promise<string> {
  return getSignedUrl(
    s3.client,
    new PutObjectCommand({
      Bucket: s3.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    }),
    { expiresIn: 300 }
  );
}

export async function presignTripGet(
  s3: S3Config,
  bucket: string,
  key: string,
  downloadName?: string
): Promise<string> {
  return getSignedUrl(
    s3.client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ...(downloadName
        ? { ResponseContentDisposition: `attachment; filename="${sanitizeFileName(downloadName)}"` }
        : {}),
    }),
    { expiresIn: 300 }
  );
}

/** Returns the object's size, or null when it does not exist. */
export async function headTripObject(
  s3: S3Config,
  bucket: string,
  key: string
): Promise<number | null> {
  try {
    const head = await s3.client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return head.ContentLength ?? 0;
  } catch {
    return null;
  }
}

export async function getTripObjectBytes(
  s3: S3Config,
  bucket: string,
  key: string
): Promise<Uint8Array> {
  const obj = await s3.client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!obj.Body) throw new Error(`S3 object ${key} has no body`);
  return obj.Body.transformToByteArray();
}

/** Best-effort delete; failures are logged, never thrown. */
export async function deleteTripObject(s3: S3Config, bucket: string, key: string): Promise<void> {
  try {
    await s3.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.error(`[trips/s3] Failed to delete ${key}:`, err);
  }
}

// ── Export packages ──────────────────────────────────────────────────────────
// Vercel functions cap response bodies at 4.5 MB, and a ZIP of receipt photos
// passes that quickly. ZIPs are written to a per-member exports/ prefix and
// handed to the browser as a presigned download; exports older than an hour
// are removed on the member's next export.

const EXPORT_TTL_MS = 60 * 60 * 1000;

export async function storeExport(
  s3: S3Config,
  userId: string,
  fileName: string,
  bytes: Uint8Array,
  contentType: string
): Promise<string> {
  const prefix = `monetura/members/${userId}/exports/`;
  try {
    const listed = await s3.client.send(new ListObjectsV2Command({ Bucket: s3.bucket, Prefix: prefix }));
    const stale = (listed.Contents ?? []).filter(
      (o) => o.Key && o.LastModified && Date.now() - o.LastModified.getTime() > EXPORT_TTL_MS
    );
    await Promise.all(stale.map((o) => deleteTripObject(s3, s3.bucket, o.Key as string)));
  } catch (err) {
    console.error("[trips/s3] Export cleanup failed (continuing):", err);
  }

  const key = `${prefix}${Date.now()}_${sanitizeFileName(fileName)}`;
  await s3.client.send(
    new PutObjectCommand({ Bucket: s3.bucket, Key: key, Body: bytes, ContentType: contentType })
  );
  return presignTripGet(s3, s3.bucket, key, fileName);
}
