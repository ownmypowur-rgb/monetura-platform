"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadTripFile } from "@/lib/trips/upload-client";
import { VoiceRecorder } from "./VoiceRecorder";
import { ErrorBanner, Field, inputClass, localToday, primaryButtonClass, secondaryButtonClass } from "./ui";

function audioFileName(blob: Blob): string {
  const ext = blob.type === "audio/mp4" ? "m4a" : blob.type === "audio/ogg" ? "ogg" : "webm";
  return `voice-note-${Date.now()}.${ext}`;
}

/** New journal entry: a voice note, typed notes, or both. */
export function JournalEntryForm({ tripId, tripEnd }: { tripId: number; tripEnd: string }) {
  const router = useRouter();
  const today = localToday();
  const [entryDate, setEntryDate] = useState(today > tripEnd ? tripEnd : today);
  const [rawText, setRawText] = useState("");
  const [audio, setAudio] = useState<Blob | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!audio && !rawText.trim()) {
      setError("Record a voice note or type your entry.");
      return;
    }
    try {
      let audioAttachmentId: number | null = null;
      if (audio) {
        setSaving("Uploading voice note…");
        audioAttachmentId = await uploadTripFile(tripId, "audio", audio, audioFileName(audio));
      }
      setSaving("Saving…");
      const res = await fetch(`/api/trips/${tripId}/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryDate, rawText: rawText.trim() || null, audioAttachmentId }),
      });
      const data = (await res.json().catch(() => null)) as { id?: number; error?: string } | null;
      if (!res.ok || !data?.id) {
        setError(data?.error ?? "Could not save the entry.");
        return;
      }
      // The entry page starts transcription on arrival when there is audio.
      router.push(`/trips/${tripId}/journal/${data.id}${audio ? "?transcribe=1" : ""}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save — check your connection and try again.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Date" htmlFor="entryDate" required>
        <input id="entryDate" type="date" className={inputClass} value={entryDate} required
          onChange={(e) => setEntryDate(e.target.value)} />
      </Field>

      <div>
        <p className="block text-xs font-bold tracking-[0.15em] uppercase text-[#B99B74] mb-2">Voice note</p>
        <VoiceRecorder onChange={setAudio} disabled={saving !== null} />
      </div>

      <Field label="Typed notes" htmlFor="rawText"
        hint="Anything you'd rather type — or add to the voice note. Who you met, where, and why.">
        <textarea id="rawText" className={`${inputClass} min-h-[140px]`} value={rawText} maxLength={20000}
          onChange={(e) => setRawText(e.target.value)} />
      </Field>

      <ErrorBanner message={error} />

      <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-gradient-to-t from-[#1A0F0A] via-[#1A0F0A] to-transparent flex gap-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        <button type="button" className={secondaryButtonClass} onClick={() => router.back()}>Cancel</button>
        <button type="submit" className={`${primaryButtonClass} flex-1`} disabled={saving !== null}>
          {saving ?? "Save entry"}
        </button>
      </div>
    </form>
  );
}
