import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listMemberTrips } from "@/lib/trips/server";
import { formatCad } from "@/lib/trips/money";
import { TRIP_TYPE_LABELS } from "@/lib/trips/constants";
import { BackLink, Card, PageHeading, formatDateRange, primaryButtonClass } from "@/components/trips/ui";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const session = await auth();
  if (!session?.user?.memberId) redirect("/login");

  const trips = await listMemberTrips(session.user.memberId);

  return (
    <>
      <BackLink href="/dashboard" label="Dashboard" />
      <PageHeading eyebrow="Trip Records" title="Trips">
        <p className="mt-2 text-base text-[#C4A882]">
          Receipts, expenses and daily notes for each trip — organized for your accountant.
        </p>
      </PageHeading>

      <Link href="/trips/new" className={`${primaryButtonClass} w-full sm:w-auto no-underline mb-6`}>
        + New trip
      </Link>

      {trips.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-xl text-monetura-cream mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            No trips yet
          </p>
          <p className="text-sm text-[#C4A882]">
            Create a trip before you travel, then add each expense as it happens — snap the receipt at the table.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link href={`/trips/${trip.id}`} className="block no-underline">
                <Card className="p-4 active:bg-[#3D2E26] transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-monetura-cream truncate" style={{ fontFamily: "var(--font-heading)" }}>
                        {trip.name}
                      </p>
                      <p className="text-sm text-[#C4A882] truncate">{trip.destinations}</p>
                      <p className="text-sm text-[#B99B74] mt-1">
                        {formatDateRange(trip.startDate, trip.endDate)} · {TRIP_TYPE_LABELS[trip.tripType]}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-semibold text-monetura-champagne tabular-nums">{formatCad(trip.totalCad)}</p>
                      <p className="text-sm text-[#B99B74]">
                        {trip.expenseCount} {trip.expenseCount === 1 ? "expense" : "expenses"}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
