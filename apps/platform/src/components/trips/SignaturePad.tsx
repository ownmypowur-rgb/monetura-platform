"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { secondaryButtonClass, primaryButtonClass } from "./ui";

const INK = "#2C2420";
const HEIGHT = 200;

/**
 * Finger/stylus signature capture. Draws dark ink on white so the PNG reads
 * the same on screen and in the PDF export. On save, the signer's name and the
 * local date/time are stamped along the bottom edge of the image itself, so
 * the file stands on its own if it is ever separated from the record.
 */
export function SignaturePad({
  signerName,
  onSave,
  disabled,
}: {
  signerName: string;
  onSave: (png: Blob) => Promise<void>;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(HEIGHT * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, HEIGHT);
    // Signature line
    ctx.strokeStyle = "#C9BBA8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, HEIGHT - 44);
    ctx.lineTo(width - 16, HEIGHT - 44);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setHasInk(false);
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = point(e);
    drawing.current = true;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
    setHasInk(true);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function up() {
    drawing.current = false;
  }

  async function save() {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk || !signerName.trim()) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const stamp = `Signed by ${signerName.trim()} · ${new Date().toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}`;
    ctx.save();
    ctx.fillStyle = "#6B5A48";
    ctx.font = "12px system-ui, -apple-system, sans-serif";
    ctx.fillText(stamp, 16, HEIGHT - 20, canvas.clientWidth - 32);
    ctx.restore();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    setSaving(true);
    try {
      await onSave(blob);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        aria-label="Signature pad — the vendor signs here with a finger"
        className="w-full rounded-xl border border-monetura-mocha bg-white"
        style={{ height: HEIGHT, touchAction: "none" }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      />
      <div className="flex gap-2">
        <button type="button" className={`${secondaryButtonClass} flex-1`} onClick={reset} disabled={saving || !hasInk}>
          Clear
        </button>
        <button type="button" className={`${primaryButtonClass} flex-1`} onClick={save}
          disabled={saving || disabled || !hasInk || !signerName.trim()}>
          {saving ? "Saving…" : "Save signature"}
        </button>
      </div>
      {!signerName.trim() && hasInk && (
        <p className="text-sm text-[#E8C88A]">Enter the signer&apos;s name above before saving.</p>
      )}
    </div>
  );
}
