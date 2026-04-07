"use client";

import { useRef, useState, useCallback } from "react";

// ── Brand colours ────────────────────────────────────────────────────────────
const C = {
  bg: "#130D0A",
  card: "#2C2420",
  cardBorder: "#4A3728",
  gold: "#D4A853",
  goldDark: "#C4973D",
  mocha: "#C4A882",
  canyon: "#E8DCCB",
  cream: "#FBF5ED",
  terracotta: "#C17A4A",
  success: "#5A9E6F",
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 10;

// ── Types ─────────────────────────────────────────────────────────────────────

type UploadStatus = "pending" | "uploading" | "done" | "error";

interface FileEntry {
  id: string;
  file: File;
  preview: string;
  status: UploadStatus;
  progress: number;
  mediaUploadId?: number;
  publicUrl?: string;
  error?: string;
}

interface PresignResponse {
  uploadUrl: string;
  s3Key: string;
  mediaUploadId: number;
  publicUrl: string;
}

interface ConfirmResponse {
  success: boolean;
  publicUrl: string | null;
}

interface UploadZoneProps {
  onMediaUploadIds: (ids: number[]) => void;
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Upload via XMLHttpRequest (supports progress events) ─────────────────────

function uploadToS3(
  url: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.send(file);
  });
}

// ── UploadZone ────────────────────────────────────────────────────────────────

export function UploadZone({ onMediaUploadIds }: UploadZoneProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function updateEntry(id: string, patch: Partial<FileEntry>) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  }

  function removeEntry(id: string) {
    const removed = entries.find((e) => e.id === id);
    if (removed?.preview) URL.revokeObjectURL(removed.preview);
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    onMediaUploadIds(
      next
        .filter((e) => e.status === "done" && e.mediaUploadId !== undefined)
        .map((e) => e.mediaUploadId!)
    );
  }

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = MAX_FILES - entries.length;
      if (remaining <= 0) return;

      const toProcess = fileArray.slice(0, remaining);

      const newEntries: FileEntry[] = toProcess
        .filter((f) => {
          if (!ALLOWED_TYPES.includes(f.type)) return false;
          if (f.size > MAX_FILE_SIZE) return false;
          return true;
        })
        .map((f) => ({
          id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
          file: f,
          preview: URL.createObjectURL(f),
          status: "pending" as UploadStatus,
          progress: 0,
        }));

      if (newEntries.length === 0) return;

      setEntries((prev) => [...prev, ...newEntries]);

      // Upload each file
      for (const entry of newEntries) {
        updateEntry(entry.id, { status: "uploading", progress: 0 });

        try {
          // 1. Get presigned URL
          const presignRes = await fetch("/api/upload/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: entry.file.name,
              fileType: entry.file.type,
              fileSize: entry.file.size,
            }),
          });

          if (!presignRes.ok) {
            const err = (await presignRes.json()) as { error?: string };
            throw new Error(err.error ?? "Failed to get upload URL");
          }

          const presign = (await presignRes.json()) as PresignResponse;

          // 2. PUT directly to S3
          await uploadToS3(presign.uploadUrl, entry.file, (pct) => {
            updateEntry(entry.id, { progress: pct });
          });

          // 3. Confirm upload
          const confirmRes = await fetch("/api/upload/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mediaUploadId: presign.mediaUploadId }),
          });

          if (!confirmRes.ok) {
            throw new Error("Failed to confirm upload");
          }

          const confirm = (await confirmRes.json()) as ConfirmResponse;

          updateEntry(entry.id, {
            status: "done",
            progress: 100,
            mediaUploadId: presign.mediaUploadId,
            publicUrl: confirm.publicUrl ?? presign.publicUrl,
          });

          // Notify parent — read state after the sync update above settles
          setEntries((prev) => {
            const ids = prev
              .map((e) =>
                e.id === entry.id
                  ? presign.mediaUploadId
                  : e.status === "done"
                    ? e.mediaUploadId
                    : undefined
              )
              .filter((id): id is number => id !== undefined);
            // Schedule the parent notification outside the updater
            Promise.resolve().then(() => onMediaUploadIds(ids));
            return prev;
          });
        } catch (err) {
          updateEntry(entry.id, {
            status: "error",
            error: err instanceof Error ? err.message : "Upload failed",
          });
        }
      }
    },
    [entries.length, onMediaUploadIds]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      void processFiles(e.target.files);
      // Reset input so the same file can be re-selected after removal
      e.target.value = "";
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      void processFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  async function retryEntry(entry: FileEntry) {
    updateEntry(entry.id, { status: "uploading", progress: 0, error: undefined });

    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: entry.file.name,
          fileType: entry.file.type,
          fileSize: entry.file.size,
        }),
      });

      if (!presignRes.ok) {
        const err = (await presignRes.json()) as { error?: string };
        throw new Error(err.error ?? "Failed to get upload URL");
      }

      const presign = (await presignRes.json()) as PresignResponse;

      await uploadToS3(presign.uploadUrl, entry.file, (pct) => {
        updateEntry(entry.id, { progress: pct });
      });

      const confirmRes = await fetch("/api/upload/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaUploadId: presign.mediaUploadId }),
      });

      if (!confirmRes.ok) throw new Error("Failed to confirm upload");

      const confirm = (await confirmRes.json()) as ConfirmResponse;

      updateEntry(entry.id, {
        status: "done",
        progress: 100,
        mediaUploadId: presign.mediaUploadId,
        publicUrl: confirm.publicUrl ?? presign.publicUrl,
      });

      setEntries((prev) => {
        const ids = prev
          .map((e) =>
            e.id === entry.id
              ? presign.mediaUploadId
              : e.status === "done"
                ? e.mediaUploadId
                : undefined
          )
          .filter((id): id is number => id !== undefined);
        Promise.resolve().then(() => onMediaUploadIds(ids));
        return prev;
      });
    } catch (err) {
      updateEntry(entry.id, {
        status: "error",
        error: err instanceof Error ? err.message : "Upload failed",
      });
    }
  }

  const canAddMore = entries.length < MAX_FILES;
  const hasEntries = entries.length > 0;

  return (
    <div className="space-y-3">
      {/* Drop zone (only shown when under MAX_FILES) */}
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className="relative flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-2xl cursor-pointer transition-all select-none"
          style={{
            background: isDragging
              ? "rgba(212,168,83,0.06)"
              : "rgba(212,168,83,0.02)",
            border: `2px dashed ${isDragging ? C.gold : "rgba(212,168,83,0.35)"}`,
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          aria-label="Upload photos"
        >
          <div style={{ color: isDragging ? C.gold : C.canyon }}>
            <CameraIcon />
          </div>
          <div className="text-center space-y-1">
            <p
              className="text-base font-medium"
              style={{
                color: isDragging ? C.gold : C.cream,
                fontFamily: "var(--font-heading)",
              }}
            >
              Upload Photos
            </p>
            <p className="text-sm" style={{ color: C.mocha }}>
              or drag and drop
            </p>
          </div>
          <p className="text-xs text-center" style={{ color: C.mocha }}>
            JPEG, PNG, WEBP up to 20MB each · Max {MAX_FILES} photos
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="mt-1 px-5 py-2.5 rounded-xl text-sm font-semibold tracking-[0.1em] uppercase transition-all active:scale-[0.97]"
            style={{
              background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDark} 100%)`,
              color: "#2C2420",
              boxShadow: "0 4px 12px rgba(212,168,83,0.25)",
              fontFamily: "var(--font-heading)",
            }}
          >
            Add Photos
          </button>

          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            multiple
            capture={undefined}
            className="sr-only"
            onChange={handleFileChange}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Photo grid */}
      {hasEntries && (
        <div className="grid grid-cols-3 gap-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="relative aspect-square rounded-xl overflow-hidden"
              style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}
            >
              {/* Preview image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.preview}
                alt={entry.file.name}
                className="w-full h-full object-cover"
              />

              {/* Status overlay */}
              {entry.status === "uploading" && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                  style={{ background: "rgba(19,13,10,0.7)" }}
                >
                  {/* Progress bar */}
                  <div
                    className="w-3/4 rounded-full overflow-hidden"
                    style={{ height: "3px", background: C.cardBorder }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-150"
                      style={{
                        width: `${entry.progress}%`,
                        background: `linear-gradient(90deg, ${C.gold}, ${C.goldDark})`,
                      }}
                    />
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: C.gold, fontFamily: "var(--font-heading)" }}
                  >
                    {entry.progress}%
                  </p>
                </div>
              )}

              {/* Done checkmark */}
              {entry.status === "done" && (
                <div
                  className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: C.success }}
                >
                  <CheckIcon />
                </div>
              )}

              {/* Error overlay */}
              {entry.status === "error" && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2"
                  style={{ background: "rgba(19,13,10,0.85)" }}
                >
                  <p
                    className="text-xs text-center leading-tight"
                    style={{ color: C.terracotta }}
                  >
                    {entry.error ?? "Upload failed"}
                  </p>
                  <button
                    type="button"
                    onClick={() => void retryEntry(entry)}
                    className="text-xs px-2.5 py-1 rounded-lg"
                    style={{
                      background: "rgba(212,168,83,0.15)",
                      border: "1px solid rgba(212,168,83,0.3)",
                      color: C.gold,
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Remove button */}
              {entry.status !== "uploading" && (
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: "rgba(19,13,10,0.75)",
                    border: "1px solid rgba(212,168,83,0.3)",
                    color: C.canyon,
                  }}
                  aria-label={`Remove ${entry.file.name}`}
                >
                  <XIcon />
                </button>
              )}
            </div>
          ))}

          {/* Add more tile (when photos already exist and room remains) */}
          {canAddMore && hasEntries && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
              style={{
                background: "rgba(212,168,83,0.03)",
                border: `2px dashed rgba(212,168,83,0.25)`,
                color: C.mocha,
              }}
              aria-label="Add more photos"
            >
              <span className="text-xl" style={{ color: C.gold }}>+</span>
              <span className="text-xs" style={{ fontFamily: "var(--font-heading)" }}>
                Add More
              </span>
            </button>
          )}
        </div>
      )}

      {/* Count indicator */}
      {hasEntries && (
        <p className="text-xs text-right" style={{ color: C.mocha }}>
          {entries.length}/{MAX_FILES} photos
        </p>
      )}
    </div>
  );
}
