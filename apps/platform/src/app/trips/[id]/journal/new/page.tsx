import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMemberTrip, parseId } from "@/lib/trips/server";
import { BackLink, PageHeading } from "@/components/trips/ui";
import { JournalEntryForm } from "@/components/trips/JournalEntryForm";

export const dynamic = "force-dynamic";

export default async function NewJournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.memberId) redirect("/login");
  const tripId = parseId((await params).id);
  const trip = tripId ? await getMemberTrip(session.user.memberId, tripId) : null;
  if (!trip) notFound();

  return (
    <>
      <BackLink href={`/trips/${trip.id}?tab=journal`} label={trip.name} />
      <PageHeading eyebrow={trip.name} title="Journal entry">
        <p className="mt-2 text-sm text-[#C4A882]">
          Talk through your day: where you went, who you met, and why. Your recording and words are kept exactly as you give them.
        </p>
      </PageHeading>
      <JournalEntryForm tripId={trip.id} tripEnd={trip.endDate} />
    </>
  );
}
