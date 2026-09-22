"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { prepareImage, uploadTripFile } from "@/lib/trips/upload-client";
import { primaryButtonClass, secondaryButtonClass } from "./ui";

/**
 * "Add expense" opens the phone's camera directly (capture attribute). The
 * photo uploads here, then the form opens with it attached — so at the table
 * it is one tap to the camera and one tap to "Read with AI". Cash purchases
 * without a receipt take the second button.
 */
export function AddExpenseButtons({ tripId }: { tripId: number }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { blob, name } = await prepareImage(file);
      const id = await uploadTripFile(tripId, "receipt_photo", blob, name);
      router.push(`/trips/${tripId}/expenses/new?receipt=${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input ref={input} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { void onPhoto(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button type="button" className={primaryButtonClass} onClick={() => input.current?.click()} disabled={busy}>
          {busy ? "Uploading photo…" : "📷 Add expense"}
        </button>
        <Link href={`/trips/${tripId}/expenses/new?evidence=none`} className={`${secondaryButtonClass} no-underline text-sm px-4`}>
          No receipt
        </Link>
      </div>
      {error && <p role="alert" className="text-sm text-[#FCA5A5]">{error}</p>}
    </div>
  );
}
