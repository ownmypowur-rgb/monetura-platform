import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMemberJournalEntry, getMemberTrip, parseId } from "@/lib/trips/server";
import { BackLink, PageHeading, formatDay } from "@/components/trips/ui";
import { JournalEntryView } from "@/components/trips/JournalEntryView";
import { DeleteJournalEntryButton } from "@/components/trips/DeleteButtons";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string; entryId: string }>;
  searchParams: Promise<{ transcribe?: string }>;
}

export default async function JournalEntryPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.memberId) redirect("/login");
  const { memberId } = session.user;
  const p = await params;
  const tripId = parseId(p.id);
  const entryId = parseId(p.entryId);
  const trip = tripId ? await getMemberTrip(memberId, tripId) : null;
  const entry = trip && entryId ? await getMemberJournalEntry(memberId, trip.id, entryId) : null;
  if (!trip || !entry) notFound();

  return (
    <>
      <BackLink href={`/trips/${trip.id}?tab=journal`} label={trip.name} />
      <PageHeading eyebrow={`${trip.name} · Journal`} title={formatDay(entry.entryDate)} />
      <JournalEntryView
        tripId={trip.id}
        autoTranscribe={(await searchParams).transcribe === "1"}
        entry={{
          id: entry.id,
          entryDate: entry.entryDate,
          rawText: entry.rawText,
          audioAttachmentId: entry.audioAttachmentId,
          transcript: entry.transcript,
          transcriptStatus: entry.transcriptStatus,
          aiSummaryFirst: entry.aiSummaryFirst,
          aiSummary: entry.aiSummary,
          summaryStatus: entry.summaryStatus,
          summaryGeneratedAt: entry.summaryGeneratedAt?.toISOString() ?? null,
          summaryEditedAt: entry.summaryEditedAt?.toISOString() ?? null,
        }}
      />
      <div className="mt-10 pt-6 border-t border-monetura-mocha">
        <DeleteJournalEntryButton tripId={trip.id} entryId={entry.id} />
      </div>
    </>
  );
}
