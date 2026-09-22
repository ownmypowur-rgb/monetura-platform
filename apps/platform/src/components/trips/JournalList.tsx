import Link from "next/link";
import type { JournalRow } from "@/lib/trips/server";
import { Card, formatDay, primaryButtonClass } from "./ui";

function preview(e: JournalRow): string {
  const text = e.aiSummary || (e.transcriptStatus === "completed" ? e.transcript : null) || e.rawText || "";
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > 160 ? `${flat.slice(0, 157)}…` : flat;
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-monetura-mocha px-2 py-0.5 text-xs text-[#C4A882]">{children}</span>;
}

export function JournalList({ tripId, entries }: { tripId: number; entries: JournalRow[] }) {
  return (
    <>
      {entries.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-xl text-monetura-cream mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            No journal entries yet
          </p>
          <p className="text-sm text-[#C4A882]">
            At the end of each day, record a quick voice note about who you met and why. It takes a minute and makes
            the trip easy to explain later.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id}>
              <Link href={`/trips/${tripId}/journal/${e.id}`} className="block no-underline">
                <Card className="p-4 active:bg-[#3D2E26]">
                  <p className="text-sm font-bold tracking-[0.12em] uppercase text-[#B99B74]">{formatDay(e.entryDate)}</p>
                  {preview(e) && <p className="mt-1 text-base text-monetura-sand">{preview(e)}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {e.audioAttachmentId && <Chip>🎙 Voice note</Chip>}
                    {e.transcriptStatus === "completed" && <Chip>Transcript</Chip>}
                    {e.transcriptStatus === "not_enabled" && <Chip>Transcription not enabled</Chip>}
                    {e.transcriptStatus === "failed" && <Chip>Transcription failed</Chip>}
                    {e.rawText && <Chip>Typed notes</Chip>}
                    {e.summaryStatus !== "none" && <Chip>✦ AI summary{e.summaryStatus === "edited" ? " (edited)" : ""}</Chip>}
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="sticky bottom-0 -mx-4 sm:mx-0 mt-6 px-4 sm:px-0 py-3 bg-gradient-to-t from-[#1A0F0A] via-[#1A0F0A] to-transparent"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        <Link href={`/trips/${tripId}/journal/new`} className={`${primaryButtonClass} w-full no-underline`}>
          🎙 New journal entry
        </Link>
      </div>
    </>
  );
}
