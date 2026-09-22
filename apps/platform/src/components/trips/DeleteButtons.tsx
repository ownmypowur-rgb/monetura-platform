"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RETENTION_WARNING } from "@/lib/trips/constants";
import { ErrorBanner, dangerButtonClass, secondaryButtonClass } from "./ui";

/**
 * Two-step delete: the first tap reveals the six-year retention warning, the
 * second (explicit) tap deletes. No browser confirm() — it is easy to dismiss
 * by reflex on a phone and can't carry the warning's weight.
 */
function ConfirmDelete({
  what,
  url,
  redirectTo,
  extraNote,
}: {
  what: string;
  url: string;
  redirectTo: string;
  extraNote?: string;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? `Could not delete this ${what}.`);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError(`Could not delete this ${what} — check your connection.`);
    } finally {
      setBusy(false);
    }
  }

  if (!armed) {
    return (
      <button type="button" className={`${dangerButtonClass} w-full sm:w-auto`} onClick={() => setArmed(true)}>
        Delete {what}
      </button>
    );
  }

  return (
    <div role="alertdialog" aria-label={`Delete ${what}`} className="rounded-2xl border border-[#7F2F2F] bg-[rgba(220,38,38,0.08)] p-4 space-y-3">
      <p className="text-base text-monetura-cream font-semibold">Delete this {what}?</p>
      <p className="text-sm text-[#E8DCCB]">{RETENTION_WARNING}</p>
      {extraNote && <p className="text-sm text-[#E8DCCB]">{extraNote}</p>}
      <ErrorBanner message={error} />
      <div className="flex flex-col-reverse sm:flex-row gap-2">
        <button type="button" className={secondaryButtonClass} onClick={() => setArmed(false)} disabled={busy}>
          Keep it
        </button>
        <button type="button" className={dangerButtonClass} onClick={doDelete} disabled={busy}>
          {busy ? "Deleting…" : `Yes, delete ${what}`}
        </button>
      </div>
    </div>
  );
}

export function DeleteTripButton({ tripId }: { tripId: number }) {
  return (
    <ConfirmDelete
      what="trip"
      url={`/api/trips/${tripId}`}
      redirectTo="/trips"
      extraNote="Only a trip with no expenses or journal entries can be deleted."
    />
  );
}

export function DeleteExpenseButton({ tripId, expenseId }: { tripId: number; expenseId: number }) {
  return (
    <ConfirmDelete
      what="expense"
      url={`/api/trips/${tripId}/expenses/${expenseId}`}
      redirectTo={`/trips/${tripId}`}
      extraNote="Its receipt photos, signature and edit history are deleted with it."
    />
  );
}

export function DeleteJournalEntryButton({ tripId, entryId }: { tripId: number; entryId: number }) {
  return (
    <ConfirmDelete
      what="journal entry"
      url={`/api/trips/${tripId}/journal/${entryId}`}
      redirectTo={`/trips/${tripId}?tab=journal`}
      extraNote="Its voice recording, transcript and AI summary are deleted with it."
    />
  );
}
