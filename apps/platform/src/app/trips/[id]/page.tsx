import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getMemberTrip,
  getRevisionCounts,
  getTripAttachments,
  getTripExpenses,
  parseId,
} from "@/lib/trips/server";
import { TRIP_TYPE_LABELS } from "@/lib/trips/constants";
import { BackLink, Card, formatDateRange } from "@/components/trips/ui";
import { AddExpenseButtons } from "@/components/trips/AddExpenseButtons";
import { ExpenseLedger } from "@/components/trips/ExpenseLedger";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "expenses", label: "Expenses" },
  { id: "journal", label: "Journal" },
  { id: "export", label: "Export" },
] as const;
type TabId = (typeof TABS)[number]["id"];

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function TripDetailPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.memberId) redirect("/login");
  const { memberId } = session.user;

  const tripId = parseId((await params).id);
  const trip = tripId ? await getMemberTrip(memberId, tripId) : null;
  if (!trip) notFound();

  const requested = (await searchParams).tab;
  const tab: TabId = TABS.some((t) => t.id === requested) ? (requested as TabId) : "expenses";

  return (
    <>
      <BackLink href="/trips" label="Trips" />

      <div className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-semibold leading-tight text-monetura-cream" style={{ fontFamily: "var(--font-heading)" }}>
            {trip.name}
          </h1>
          <Link href={`/trips/${trip.id}/edit`} className="flex-shrink-0 rounded-lg border border-monetura-mocha px-3 py-1.5 text-sm text-monetura-sand no-underline">
            Edit
          </Link>
        </div>
        <p className="text-base text-[#C4A882] mt-1">{trip.destinations}</p>
        <p className="text-sm text-[#B99B74] mt-1">
          {formatDateRange(trip.startDate, trip.endDate)} · {TRIP_TYPE_LABELS[trip.tripType]} · {trip.businessUsePercent}% business use
        </p>
        <details className="mt-3 group">
          <summary className="cursor-pointer text-sm text-monetura-champagne list-none">
            Business purpose <span className="group-open:hidden">▸</span><span className="hidden group-open:inline">▾</span>
          </summary>
          <p className="mt-2 text-sm text-monetura-sand whitespace-pre-wrap">{trip.businessPurpose}</p>
          {trip.notes && <p className="mt-2 text-sm text-[#C4A882] whitespace-pre-wrap">{trip.notes}</p>}
        </details>
      </div>

      <nav aria-label="Trip sections" className="grid grid-cols-3 gap-1 rounded-xl bg-monetura-charcoal border border-monetura-mocha p-1 mb-6">
        {TABS.map((t) => (
          <Link key={t.id} href={`/trips/${trip.id}${t.id === "expenses" ? "" : `?tab=${t.id}`}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={`rounded-lg py-2.5 text-center text-sm font-semibold no-underline ${tab === t.id ? "bg-monetura-champagne text-monetura-charcoal" : "text-monetura-sand"}`}>
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "expenses" && <ExpensesTab memberId={memberId} tripId={trip.id} />}
      {tab === "journal" && <ComingSoon what="The daily journal" />}
      {tab === "export" && <ComingSoon what="Accountant export" />}
    </>
  );
}

async function ExpensesTab({ memberId, tripId }: { memberId: number; tripId: number }) {
  const [expenses, attachments] = await Promise.all([
    getTripExpenses(memberId, tripId),
    getTripAttachments(memberId, tripId),
  ]);
  const revisionCounts = await getRevisionCounts(memberId, expenses.map((e) => e.id));
  const attachmentCounts = new Map<number, number>();
  for (const a of attachments) {
    if (a.expenseId !== null) attachmentCounts.set(a.expenseId, (attachmentCounts.get(a.expenseId) ?? 0) + 1);
  }

  return (
    <>
      <ExpenseLedger tripId={tripId} expenses={expenses} attachmentCounts={attachmentCounts} revisionCounts={revisionCounts} />
      {/* Thumb-reach add button, pinned above the fold on phones */}
      <div className="sticky bottom-0 -mx-4 sm:mx-0 mt-6 px-4 sm:px-0 py-3 bg-gradient-to-t from-[#1A0F0A] via-[#1A0F0A] to-transparent"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        <AddExpenseButtons tripId={tripId} />
      </div>
    </>
  );
}

function ComingSoon({ what }: { what: string }) {
  return (
    <Card className="p-8 text-center">
      <p className="text-base text-monetura-sand">{what} arrives in the next update.</p>
    </Card>
  );
}
