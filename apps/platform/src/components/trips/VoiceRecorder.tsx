"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_RECORDING_SECONDS } from "@/lib/trips/constants";
import { primaryButtonClass, secondaryButtonClass } from "./ui";

// iOS Safari records audio/mp4 (AAC) and can't record webm; Chrome and
// Firefox record webm/Opus. Order matters: take the first the browser supports.
const MIME_CANDIDATES = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return undefined;
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
}

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Phase = "idle" | "starting" | "recording" | "recorded" | "unsupported";

/**
 * Records one voice note. The parent receives the finished blob via
 * `onChange` (or null after "Re-record"), and uploads it on save. Nothing
 * leaves the phone until the member saves.
 */
export function VoiceRecorder({ onChange, disabled }: { onChange: (blob: Blob | null) => void; disabled?: boolean }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined" && (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia)) {
      setPhase("unsupported");
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function stopTracks() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function start() {
    setError(null);
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 64_000,
      });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stopTracks();
        const type = (recorder.mimeType || mimeType || "audio/webm").split(";")[0] ?? "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size === 0) {
          setError("Nothing was recorded. Check the microphone and try again.");
          setPhase("idle");
          return;
        }
        setPreviewUrl(URL.createObjectURL(blob));
        setPhase("recorded");
        onChange(blob);
      };
      recorderRef.current = recorder;
      // No timeslice: some iOS Safari versions produce fragmented MP4 chunks
      // that don't concatenate into a playable file. One blob at stop() is
      // at most ~5 MB for 10 minutes at 64 kbps.
      recorder.start();
      startedAtRef.current = Date.now();
      setElapsed(0);
      setPhase("recording");
      timerRef.current = setInterval(() => {
        const secs = (Date.now() - startedAtRef.current) / 1000;
        setElapsed(secs);
        if (secs >= MAX_RECORDING_SECONDS && recorder.state === "recording") recorder.stop();
      }, 250);
    } catch (err) {
      stopTracks();
      const denied = err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError");
      setError(
        denied
          ? "Microphone access is blocked. Allow it for this site in your browser settings, or type your entry instead."
          : "Couldn't start recording on this device. You can type your entry instead."
      );
      setPhase("idle");
    }
  }

  function stop() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  function reRecord() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setElapsed(0);
    setPhase("idle");
    onChange(null);
  }

  if (phase === "unsupported") {
    return (
      <p className="text-sm text-[#C4A882]">
        Voice recording isn&apos;t available in this browser. Type your entry below instead.
      </p>
    );
  }

  const remaining = Math.max(0, MAX_RECORDING_SECONDS - elapsed);

  return (
    <div className="rounded-2xl border border-monetura-mocha bg-monetura-charcoal p-4 space-y-3">
      {phase === "recording" ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E35D5D] opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#E35D5D]" />
            </span>
            <span className="text-2xl tabular-nums text-monetura-cream" role="timer" aria-live="off">
              {clock(elapsed)}
            </span>
            <span className="text-sm text-[#C4A882]">{clock(remaining)} left</span>
          </div>
          <button type="button" className={primaryButtonClass} onClick={stop}>
            ■ Stop
          </button>
        </div>
      ) : phase === "recorded" && previewUrl ? (
        <div className="space-y-3">
          <p className="text-sm text-monetura-sand">Voice note · {clock(elapsed)} — listen back before saving.</p>
          <audio controls src={previewUrl} className="w-full" />
          <button type="button" className={`${secondaryButtonClass} w-full`} onClick={reRecord} disabled={disabled}>
            ↺ Re-record
          </button>
        </div>
      ) : (
        <button type="button" className={`${primaryButtonClass} w-full`} onClick={start} disabled={disabled || phase === "starting"}>
          {phase === "starting" ? "Starting microphone…" : "🎙 Record voice note"}
        </button>
      )}
      <p className="text-xs text-[#B99B74]">Up to {MAX_RECORDING_SECONDS / 60} minutes. Recording stops automatically at the limit.</p>
      {error && <p role="alert" className="text-sm text-[#FCA5A5]">{error}</p>}
    </div>
  );
}
