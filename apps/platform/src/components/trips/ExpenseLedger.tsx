import Link from "next/link";
import type { ExpenseRow } from "@/lib/trips/server";
import { CAD_SCALE, formatCad, formatMoney, sumDecimals } from "@/lib/trips/money";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  EVIDENCE_LABELS,
  MEALS_FLAG,
  type ExpenseCategory,
} from "@/lib/trips/constants";
import { Card, formatDay } from "./ui";

interface LedgerProps {
  tripId: number;
  expenses: ExpenseRow[];
  attachmentCounts: Map<number, number>;
  revisionCounts: Map<number, number>;
}

/**
 * Ledger grouped by day, then CAD totals by category and a trip total.
 * Totals are plain sums of the CAD amounts — no percentage or deductibility
 * arithmetic is applied anywhere (DECISIONS [Sprint 10]).
 */
export function ExpenseLedger({ tripId, expenses, attachmentCounts, revisionCounts }: LedgerProps) {
  if (expenses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-xl text-monetura-cream mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          No expenses yet
        </p>
        <p className="text-sm text-[#C4A882]">
          Tap “Add expense” to photograph a receipt, or record a cash purchase with a vendor note or signature.
        </p>
      </Card>
    );
  }

  const byDay = new Map<string, ExpenseRow[]>();
  for (const e of expenses) {
    const list = byDay.get(e.expenseDate) ?? [];
    list.push(e);
    byDay.set(e.expenseDate, list);
  }

  const categoryTotals = CATEGORY_ORDER.map((category) => {
    const rows = expenses.filter((e) => e.category === category);
    return { category, count: rows.length, total: sumDecimals(rows.map((r) => r.cadAmount), CAD_SCALE) };
  }).filter((c) => c.count > 0);
  const tripTotal = sumDecimals(expenses.map((e) => e.cadAmount), CAD_SCALE);

  return (
    <div className="space-y-6">
      {Array.from(byDay.entries()).map(([day, rows]) => (
        <section key={day} aria-label={formatDay(day)}>
          <div className="flex items-baseline justify-between mb-2 px-1">
            <h3 className="text-sm font-bold tracking-[0.12em] uppercase text-[#B99B74]">{formatDay(day)}</h3>
            <span className="text-sm text-[#C4A882] tabular-nums">
              {formatCad(sumDecimals(rows.map((r) => r.cadAmount), CAD_SCALE))}
            </span>
          </div>
          <Card className="divide-y divide-[#3D2E26] overflow-hidden">
            {rows.map((e) => (
              <Link key={e.id} href={`/trips/${tripId}/expenses/${e.id}`}
                className="flex items-start justify-between gap-3 px-4 py-3 no-underline active:bg-[#3D2E26]">
                <div className="min-w-0">
                  <p className="text-base text-monetura-cream truncate">{e.vendorName}</p>
                  <p className="text-sm text-[#C4A882]">
                    {CATEGORY_LABELS[e.category]}
                    {e.category === "meals" && (
                      <span className="ml-2 inline-block rounded-full border border-[#8B6E52] px-2 text-xs text-[#E8C88A]">
                        {MEALS_FLAG}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[#B99B74] mt-0.5">
                    {EVIDENCE_LABELS[e.evidenceType]}
                    {(attachmentCounts.get(e.id) ?? 0) > 0 && ` · ${attachmentCounts.get(e.id)} file${attachmentCounts.get(e.id) === 1 ? "" : "s"}`}
                    {e.businessUsePercent < 100 && ` · ${e.businessUsePercent}% business use`}
                    {(revisionCounts.get(e.id) ?? 0) > 0 && " · Edited (original kept)"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base text-monetura-cream tabular-nums">{formatCad(e.cadAmount)}</p>
                  {e.currency !== "CAD" && (
                    <p className="text-xs text-[#B99B74] tabular-nums">{formatMoney(e.amount, e.currency)}</p>
                  )}
                </div>
              </Link>
            ))}
          </Card>
        </section>
      ))}

      <section aria-label="Totals by category">
        <h3 className="text-sm font-bold tracking-[0.12em] uppercase text-[#B99B74] mb-2 px-1">CAD totals by category</h3>
        <Card className="divide-y divide-[#3D2E26]">
          {categoryTotals.map(({ category, count, total }) => (
            <div key={category} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-base text-monetura-sand">{CATEGORY_LABELS[category as ExpenseCategory]}</p>
                <p className="text-xs text-[#B99B74]">
                  {count} {count === 1 ? "expense" : "expenses"}
                  {category === "meals" && ` · ${MEALS_FLAG}`}
                </p>
              </div>
              <p className="text-base text-monetura-cream tabular-nums">{formatCad(total)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-4 bg-[rgba(212,168,83,0.06)]">
            <p className="text-base font-semibold text-monetura-cream">Trip total</p>
            <p className="text-lg font-semibold text-monetura-champagne tabular-nums">{formatCad(tripTotal)}</p>
          </div>
        </Card>
        <p className="text-xs text-[#B99B74] mt-2 px-1">
          Totals are the full CAD amounts recorded. Business-use percentages are shown per expense for your accountant and are not applied here.
        </p>
      </section>
    </div>
  );
}
