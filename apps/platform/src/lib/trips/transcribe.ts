import "server-only";

// OpenAI speech-to-text for journal voice notes. Plain fetch + FormData — no
// SDK dependency for a single endpoint. Model defaults to gpt-4o-transcribe
// and can be overridden with OPENAI_TRANSCRIPTION_MODEL (e.g. "whisper-1").
// See DECISIONS.md [Sprint 11].

const ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";
const DEFAULT_MODEL = "gpt-4o-transcribe";
const TIMEOUT_MS = 55_000;

export function transcriptionEnabled(): boolean {
  return Boolean(process.env["OPENAI_API_KEY"]);
}

// OpenAI infers the container from the filename extension.
function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case "audio/mp4":
    case "audio/x-m4a":
      return "m4a";
    case "audio/webm":
      return "webm";
    case "audio/mpeg":
      return "mp3";
    case "audio/ogg":
      return "ogg";
    case "audio/aac":
      return "aac";
    default:
      return "webm";
  }
}

export type TranscriptionResult = { ok: true; text: string } | { ok: false; error: string };

export async function transcribeAudio(bytes: Uint8Array, mimeType: string): Promise<TranscriptionResult> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) return { ok: false, error: "OPENAI_API_KEY is not set" };

  const form = new FormData();
  form.append("file", new Blob([Buffer.from(bytes)], { type: mimeType }), `voice-note.${extensionFor(mimeType)}`);
  form.append("model", process.env["OPENAI_TRANSCRIPTION_MODEL"] || DEFAULT_MODEL);
  form.append("response_format", "json");

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    return { ok: false, error: `request failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  const body = (await res.json().catch(() => null)) as { text?: unknown; error?: { message?: string } } | null;
  if (!res.ok) {
    return { ok: false, error: `HTTP ${res.status}: ${body?.error?.message ?? "no message"}` };
  }
  if (typeof body?.text !== "string") return { ok: false, error: "response had no text" };
  return { ok: true, text: body.text.trim() };
}
