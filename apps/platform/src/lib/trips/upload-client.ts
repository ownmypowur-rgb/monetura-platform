// Browser-side upload for Trip Records attachments: presign → PUT to S3 →
// confirm. Mirrors /api/upload/* but writes monetura_trip_attachments.
import type { AttachmentType } from "./constants";

const MAX_EDGE = 2400;
const JPEG_QUALITY = 0.85;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode failed"));
    img.src = src;
  });
}

/**
 * Re-encodes a phone photo as a JPEG no larger than 2400px on its long edge.
 * Keeps receipts legible while landing around 0.5–1.5 MB — under Claude's
 * 5 MB vision limit — converts iPhone HEIC to a format every reader accepts,
 * and drops EXIF (including GPS). Browsers apply EXIF orientation when
 * drawing, so the result is upright. Falls back to the original file if the
 * browser can't decode it.
 */
export async function prepareImage(file: File): Promise<{ blob: Blob; name: string }> {
  const base = (file.name || "photo").replace(/\.[^.]+$/, "") || "photo";
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new Error("encode failed");
    return { blob, name: `${base}.jpg` };
  } catch {
    return { blob: file, name: file.name || `${base}.jpg` };
  } finally {
    URL.revokeObjectURL(url);
  }
}

interface PresignResponse {
  attachmentId?: number;
  uploadUrl?: string;
  contentType?: string;
  error?: string;
}

/** Uploads one file and returns its attachment id. Throws Error(message) on failure. */
export async function uploadTripFile(
  tripId: number,
  type: AttachmentType,
  blob: Blob,
  fileName: string
): Promise<number> {
  const presign = await fetch(`/api/trips/${tripId}/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, fileName, fileType: blob.type || "application/octet-stream", fileSize: blob.size }),
  });
  const data = (await presign.json().catch(() => null)) as PresignResponse | null;
  if (!presign.ok || !data?.attachmentId || !data.uploadUrl || !data.contentType) {
    throw new Error(data?.error ?? "Could not start the upload");
  }

  const put = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": data.contentType },
    body: blob,
  });
  if (!put.ok) throw new Error("Upload to storage failed — check your connection and try again");

  const confirm = await fetch(`/api/trips/attachments/${data.attachmentId}/confirm`, { method: "POST" });
  if (!confirm.ok) {
    const c = (await confirm.json().catch(() => null)) as { error?: string } | null;
    throw new Error(c?.error ?? "Upload could not be confirmed");
  }
  return data.attachmentId;
}

/** Removes an attachment that was uploaded but not yet saved to a record. */
export async function discardTripFile(attachmentId: number): Promise<void> {
  await fetch(`/api/trips/attachments/${attachmentId}`, { method: "DELETE" }).catch(() => undefined);
}
