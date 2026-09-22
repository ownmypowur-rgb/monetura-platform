import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMemberTrip, parseId } from "@/lib/trips/server";
import { BackLink, PageHeading } from "@/components/trips/ui";
import { TripForm } from "@/components/trips/TripForm";
import { DeleteTripButton } from "@/components/trips/DeleteButtons";

export const dynamic = "force-dynamic";

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.memberId) redirect("/login");
  const tripId = parseId((await params).id);
  const trip = tripId ? await getMemberTrip(session.user.memberId, tripId) : null;
  if (!trip) notFound();

  return (
    <>
      <BackLink href={`/trips/${trip.id}`} label={trip.name} />
      <PageHeading eyebrow="Trip Records" title="Edit trip" />
      <TripForm
        tripId={trip.id}
        initial={{
          name: trip.name,
          destinations: trip.destinations,
          startDate: trip.startDate,
          endDate: trip.endDate,
          businessPurpose: trip.businessPurpose,
          tripType: trip.tripType,
          businessUsePercent: String(trip.businessUsePercent),
          notes: trip.notes ?? "",
        }}
      />
      <div className="mt-10 pt-6 border-t border-monetura-mocha">
        <DeleteTripButton tripId={trip.id} />
      </div>
    </>
  );
}
