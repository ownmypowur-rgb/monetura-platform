import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMemberAttachment, getMemberTrip, parseId } from "@/lib/trips/server";
import { BackLink, PageHeading } from "@/components/trips/ui";
import { ExpenseForm, type FormAttachment } from "@/components/trips/ExpenseForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ receipt?: string; evidence?: string }>;
}

export default async function NewExpensePage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.memberId) redirect("/login");
  const { memberId } = session.user;
  const tripId = parseId((await params).id);
  const trip = tripId ? await getMemberTrip(memberId, tripId) : null;
  if (!trip) notFound();

  // Photo taken straight from the ledger's camera button, uploaded already.
  const initialAttachments: FormAttachment[] = [];
  const query = await searchParams;
  const receiptId = parseId(query.receipt ?? "");
  if (receiptId) {
    const a = await getMemberAttachment(memberId, receiptId);
    if (a && a.tripId === trip.id && a.status === "uploaded" && a.expenseId === null && a.journalEntryId === null) {
      initialAttachments.push({ id: a.id, type: a.type, saved: false });
    }
  }

  return (
    <>
      <BackLink href={`/trips/${trip.id}`} label={trip.name} />
      <PageHeading eyebrow={trip.name} title="Add expense" />
      <ExpenseForm
        tripId={trip.id}
        tripStart={trip.startDate}
        tripEnd={trip.endDate}
        defaultPercent={trip.businessUsePercent}
        initialAttachments={initialAttachments}
        startWithoutReceipt={query.evidence === "none"}
      />
    </>
  );
}
