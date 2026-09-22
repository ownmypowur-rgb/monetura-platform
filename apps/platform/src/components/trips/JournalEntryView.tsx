"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AI_SUMMARY_LABEL,
  SUMMARY_CREDIT_COST,
  TRANSCRIPTION_CREDIT_COST,
  type SummaryStatus,
  type TranscriptStatus,
} from "@/lib/trips/constants";
import { uploadTripFile } from "@/lib/trips/upload-client";
import { VoiceRecorder } from "./VoiceRecorder";
import { Card, ErrorBanner, inputClass, primaryButtonClass, secondaryButtonClass } from "./ui";

export interface JournalEntryData {
  id: number;
  entryDate: string;
  rawText: string | null;
  audioAttachmentId: number | null;
  transcript: string | null;
  transcriptStatus: TranscriptStatus;
  aiSummaryFirst: string | null;
  aiSummary: string | null;
  summaryStatus: SummaryStatus;
  summaryGeneratedAt: string | null;
  summaryEditedAt: string | null;
}

function stamp(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}

const sectionTitle = "text-xs font-bold tracking-[0.15em] uppercase text-[#B99B74] mb-2";

export function JournalEntryView({
  tripId,
  entry: initial,
  autoTranscribe,
}: {
  tripId: number;
  entry: JournalEntryData;
  autoTranscribe: boolean;
}) {
  const router = useRouter();
  const [entry, setEntry] = useState(initial);
  const [transcribing, setTranscribing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(initial.rawText ?? "");
  const [summaryDraft, setSummaryDraft] = useState(initial.aiSummary ?? "");
  const [newAudio, setNewAudio] = useState<Blob | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoStarted = useRef(false);

  const patch = useCallback(
    async (body: Record<string, unknown>): Promise<boolean> => {
      const res = await fetch(`/api/trips/${tripId}/journal/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not save.");
        return false;
      }
      return true;
    },
    [tripId, entry.id]
  );

  const transcribe = useCallback(async () => {
    setError(null);
    setTranscribing(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/journal/${entry.id}/transcribe`, { method: "POST" });
      const data = (await res.json().catch(() => null)) as {
        status?: TranscriptStatus;
        transcript?: string;
        error?: string;
      } | null;
      if (data?.status === "completed") {
        setEntry((e) => ({ ...e, transcript: data.transcript ?? "", transcriptStatus: "completed" }));
      } else if (data?.status === "not_enabled") {
        setEntry((e) => ({ ...e, transcriptStatus: "not_enabled" }));
        setEditingNotes(true);
      } else {
        if (data?.status === "failed") setEntry((e) => ({ ...e, transcriptStatus: "failed" }));
        setError(data?.error ?? "Transcription failed — your recording is saved.");
      }
    } catch {
      setError("Couldn't reach the transcription service — your recording is saved. Try again later.");
    } finally {
      setTranscribing(false);
      router.refresh();
    }
  }, [tripId, entry.id, router]);

  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    if (autoTranscribe) {
      router.replace(`/trips/${tripId}/journal/${entry.id}`, { scroll: false });
      if (entry.audioAttachmentId && entry.transcriptStatus === "none") void transcribe();
    }
  }, [autoTranscribe, entry.audioAttachmentId, entry.transcriptStatus, entry.id, tripId, router, transcribe]);

  async function saveNotes() {
    setError(null);
    setBusy("notes");
    const ok = await patch({ rawText: notesDraft.trim() || null });
    if (ok) {
      setEntry((e) => ({ ...e, rawText: notesDraft.trim() || null }));
      setEditingNotes(false);
      router.refresh();
    }
    setBusy(null);
  }

  async function attachVoiceNote() {
    if (!newAudio) return;
    setError(null);
    setBusy("audio");
    try {
      const ext = newAudio.type === "audio/mp4" ? "m4a" : newAudio.type === "audio/ogg" ? "ogg" : "webm";
      const id = await uploadTripFile(tripId, "audio", newAudio, `voice-note-${Date.now()}.${ext}`);
      if (await patch({ audioAttachmentId: id })) {
        setEntry((e) => ({ ...e, audioAttachmentId: id, transcriptStatus: "none" }));
        setNewAudio(null);
        setBusy(null);
        await transcribe();
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setBusy(null);
  }

  async function makeProfessional() {
    setError(null);
    setSummarizing(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/journal/${entry.id}/summarize`, { method: "POST" });
      const data = (await res.json().catch(() => null)) as { summary?: string; error?: string } | null;
      if (!res.ok || !data?.summary) {
        setError(data?.error ?? "Couldn't write the summary — you weren't charged.");
        return;
      }
      const now = new Date().toISOString();
      setEntry((e) => ({
        ...e,
        aiSummary: data.summary ?? null,
        aiSummaryFirst: e.aiSummaryFirst ?? data.summary ?? null,
        summaryStatus: "generated",
        summaryGeneratedAt: now,
      }));
      setSummaryDraft(data.summary);
      router.refresh();
    } catch {
      setError("Couldn't reach the AI — check your connection and try again.");
    } finally {
      setSummarizing(false);
    }
  }

  async function saveSummaryEdit() {
    setError(null);
    setBusy("summary");
    if (await patch({ aiSummary: summaryDraft.trim() })) {
      setEntry((e) => ({ ...e, aiSummary: summaryDraft.trim(), summaryStatus: "edited", summaryEditedAt: new Date().toISOString() }));
      router.refresh();
    }
    setBusy(null);
  }

  const hasOriginalText = Boolean(entry.rawText?.trim()) || (entry.transcriptStatus === "completed" && Boolean(entry.transcript?.trim()));
  const summaryDirty = entry.aiSummary !== null && summaryDraft.trim() !== entry.aiSummary;

  return (
    <div className="space-y-4">
      <ErrorBanner message={error} />

      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        {/* ── Original ─────────────────────────────────────────────── */}
        <Card className="p-4 space-y-5">
          <h2 className="text-lg text-monetura-cream" style={{ fontFamily: "var(--font-heading)" }}>
            Your original entry
          </h2>

          {entry.audioAttachmentId ? (
            <div>
              <p className={sectionTitle}>Voice note</p>
              <audio controls preload="metadata" src={`/api/trips/attachments/${entry.audioAttachmentId}`} className="w-full" />
            </div>
          ) : (
            <div className="space-y-2">
              <p className={sectionTitle}>Add a voice note</p>
              <VoiceRecorder onChange={setNewAudio} disabled={busy !== null} />
              {newAudio && (
                <button type="button" className={`${primaryButtonClass} w-full`} onClick={attachVoiceNote} disabled={busy !== null}>
                  {busy === "audio" ? "Uploading…" : "Save voice note"}
                </button>
              )}
            </div>
          )}

          {entry.audioAttachmentId && (
            <div>
              <p className={sectionTitle}>Verbatim transcript</p>
              {transcribing ? (
                <p className="text-sm text-[#E8C88A]" role="status">Transcribing your voice note…</p>
              ) : entry.transcriptStatus === "completed" ? (
                <p className="text-base text-monetura-sand whitespace-pre-wrap">{entry.transcript || "(no speech detected)"}</p>
              ) : entry.transcriptStatus === "not_enabled" ? (
                <div className="space-y-2">
                  <p className="text-sm text-[#E8C88A]">
                    Transcription not yet enabled. Your recording is saved — type your entry in Typed notes below.
                  </p>
                  <button type="button" className="text-sm text-monetura-champagne underline" onClick={transcribe}>
                    Check again
                  </button>
                </div>
              ) : entry.transcriptStatus === "failed" ? (
                <div className="space-y-2">
                  <p className="text-sm text-[#FCA5A5]">Transcription failed. Your recording is saved.</p>
                  <button type="button" className={secondaryButtonClass} onClick={transcribe}>
                    Try again ({TRANSCRIPTION_CREDIT_COST} credit)
                  </button>
                </div>
              ) : (
                <button type="button" className={secondaryButtonClass} onClick={transcribe}>
                  Transcribe ({TRANSCRIPTION_CREDIT_COST} credit)
                </button>
              )}
            </div>
          )}

          <div>
            <p className={sectionTitle}>Typed notes</p>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea className={`${inputClass} min-h-[140px]`} value={notesDraft} maxLength={20000}
                  onChange={(e) => setNotesDraft(e.target.value)} aria-label="Typed notes" />
                <div className="flex gap-2">
                  <button type="button" className={secondaryButtonClass}
                    onClick={() => { setEditingNotes(false); setNotesDraft(entry.rawText ?? ""); }}>
                    Cancel
                  </button>
                  <button type="button" className={`${primaryButtonClass} flex-1`} onClick={saveNotes} disabled={busy !== null}>
                    {busy === "notes" ? "Saving…" : "Save notes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {entry.rawText ? (
                  <p className="text-base text-monetura-sand whitespace-pre-wrap">{entry.rawText}</p>
                ) : (
                  <p className="text-sm text-[#C4A882]">None.</p>
                )}
                <button type="button" className="text-sm text-monetura-champagne underline" onClick={() => setEditingNotes(true)}>
                  {entry.rawText ? "Edit notes" : "Add typed notes"}
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* ── AI summary ───────────────────────────────────────────── */}
        <Card className="p-4 space-y-4 border-[rgba(212,168,83,0.35)]">
          <div>
            <h2 className="text-lg text-monetura-champagne" style={{ fontFamily: "var(--font-heading)" }}>
              {AI_SUMMARY_LABEL}
            </h2>
            {entry.summaryStatus !== "none" && (
              <p className="text-xs text-[#B99B74] mt-1">
                {entry.summaryStatus === "edited"
                  ? `Edited by you ${stamp(entry.summaryEditedAt)}`
                  : `Written by AI ${stamp(entry.summaryGeneratedAt)}`}
              </p>
            )}
          </div>

          {entry.aiSummary === null ? (
            <div className="space-y-3">
              <p className="text-sm text-[#C4A882]">
                Turns your notes and this day&apos;s expenses into a clear first-person business log. It keeps your
                amounts, names, times and places exactly as you gave them, marks anything unclear as [unclear], and never
                changes your original entry.
              </p>
              <button type="button" className={`${primaryButtonClass} w-full`} onClick={makeProfessional}
                disabled={summarizing || !hasOriginalText || transcribing}>
                {summarizing ? "Writing…" : `✦ Make it professional (${SUMMARY_CREDIT_COST} credit)`}
              </button>
              {!hasOriginalText && !transcribing && (
                <p className="text-xs text-[#B99B74]">Needs a transcript or typed notes first.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea className={`${inputClass} min-h-[220px]`} value={summaryDraft} maxLength={20000}
                aria-label={AI_SUMMARY_LABEL} onChange={(e) => setSummaryDraft(e.target.value)} />
              {summaryDirty && (
                <button type="button" className={`${primaryButtonClass} w-full`} onClick={saveSummaryEdit} disabled={busy !== null}>
                  {busy === "summary" ? "Saving…" : "Save my edits"}
                </button>
              )}
              <button type="button" className={`${secondaryButtonClass} w-full text-sm`} onClick={makeProfessional}
                disabled={summarizing || !hasOriginalText}>
                {summarizing ? "Writing…" : `Rewrite with AI (${SUMMARY_CREDIT_COST} credit)`}
              </button>
              <p className="text-xs text-[#B99B74]">
                Rewriting replaces the summary above, including your edits. The first AI version is always kept.
              </p>
              {entry.aiSummaryFirst && entry.aiSummaryFirst !== entry.aiSummary && (
                <details className="rounded-xl border border-monetura-mocha p-3">
                  <summary className="cursor-pointer text-sm text-monetura-sand">First AI version</summary>
                  <p className="mt-2 text-sm text-[#C4A882] whitespace-pre-wrap">{entry.aiSummaryFirst}</p>
                </details>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
