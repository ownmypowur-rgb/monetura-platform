import { notFound, redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, moneturaTripAttachments, moneturaTripExpenseRevisions } from "@monetura/db";
import { AUDIT_GRACE_MS, getMemberExpense, getMemberTrip, parseId } from "@/lib/trips/server";
import { CATEGORY_LABELS, RATE_SOURCE_LABELS, type ExpenseCategory, type RateSource } from "@/lib/trips/constants";
import { formatCad, formatMoney } from "@/lib/trips/money";
import { BackLink, Card, PageHeading, formatDay } from "@/components/trips/ui";
import { ExpenseForm } from "@/components/trips/ExpenseForm";
import { DeleteExpenseButton } from "@/components/trips/DeleteButtons";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string; expenseId: string }>;
}

function str(v: string | number | boolean | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

export default async function EditExpensePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.memberId) redirect("/login");
  const { memberId } = session.user;
  const p = await params;
  const tripId = parseId(p.id);
  const expenseId = parseId(p.expenseId);
  const trip = tripId ? await getMemberTrip(memberId, tripId) : null;
  const expense = trip && expenseId ? await getMemberExpense(memberId, trip.id, expenseId) : null;
  if (!trip || !expense) notFound();

  const [attachments, revisions] = await Promise.all([
    getDb()
      .select()
      .from(moneturaTripAttachments)
      .where(and(eq(moneturaTripAttachments.expenseId, expense.id), eq(moneturaTripAttachments.memberId, memberId))),
    getDb()
      .select()
      .from(moneturaTripExpenseRevisions)
      .where(
        and(eq(moneturaTripExpenseRevisions.expenseId, expense.id), eq(moneturaTripExpenseRevisions.memberId, memberId))
      )
      .orderBy(desc(moneturaTripExpenseRevisions.editedAt)),
  ]);

  const auditActive = Date.now() - expense.createdAt.getTime() > AUDIT_GRACE_MS;

  return (
    <>
      <BackLink href={`/trips/${trip.id}`} label={trip.name} />
      <PageHeading eyebrow={trip.name} title="Expense">
        <p className="mt-2 text-sm text-[#C4A882]">
          {auditActive
            ? "Recorded more than 24 hours ago — if you edit it, the original values are kept in the edit history."
            : "You can correct this freely for 24 hours after recording it. After that, edits keep the original values in an edit history."}
        </p>
      </PageHeading>

      <ExpenseForm
        tripId={trip.id}
        tripStart={trip.startDate}
        tripEnd={trip.endDate}
        defaultPercent={trip.businessUsePercent}
        expenseId={expense.id}
        initial={{
          expenseDate: expense.expenseDate,
          vendorName: expense.vendorName,
          description: expense.description ?? "",
          category: expense.category,
          amount: expense.amount,
          currency: expense.currency,
          paymentMethod: expense.paymentMethod,
          evidenceType: expense.evidenceType,
          vendorSignerName: expense.vendorSignerName ?? "",
          businessPurpose: expense.businessPurpose ?? "",
          businessUsePercent: expense.businessUsePercent,
          aiAssisted: expense.aiAssisted,
        }}
        stored={{
          exchangeRate: expense.exchangeRate,
          rateSource: expense.rateSource,
          rateDate: expense.rateDate,
          cadAmount: expense.cadAmount,
        }}
        initialAttachments={attachments
          .filter((a) => a.status === "uploaded")
          .map((a) => ({ id: a.id, type: a.type, saved: true }))}
      />

      {revisions.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-bold tracking-[0.12em] uppercase text-[#B99B74] mb-2">Edit history</h2>
          <Card className="divide-y divide-[#3D2E26]">
            {revisions.map((r) => {
              const v = r.previousValues;
              const category = str(v["category"]) as ExpenseCategory;
              const source = str(v["rateSource"]) as RateSource;
              return (
                <div key={r.id} className="px-4 py-3 text-sm">
                  <p className="text-monetura-sand">
                    Edited {r.editedAt.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })} — before this edit:
                  </p>
                  <p className="text-[#C4A882] mt-1">
                    {str(v["expenseDate"]) && formatDay(str(v["expenseDate"]))} · {str(v["vendorName"])} ·{" "}
                    {CATEGORY_LABELS[category] ?? category} · {formatMoney(str(v["amount"]), str(v["currency"]))} ·{" "}
                    {formatCad(str(v["cadAmount"]))} ({RATE_SOURCE_LABELS[source] ?? source})
                  </p>
                </div>
              );
            })}
          </Card>
        </section>
      )}

      <div className="mt-10 pt-6 border-t border-monetura-mocha">
        <DeleteExpenseButton tripId={trip.id} expenseId={expense.id} />
      </div>
    </>
  );
}
