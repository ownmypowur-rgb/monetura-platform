import "server-only";
import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import {
  getDb,
  moneturaTripExpenses,
  moneturaTripAttachments,
  moneturaTripExpenseRevisions,
} from "@monetura/db";
import {
  AUDIT_GRACE_MS,
  expenseInputSchema,
  firstIssue,
  getLinkableAttachments,
  getMemberExpense,
  missingEvidence,
  parseId,
  resolveFx,
  sameDecimal,
  snapshotExpense,
} from "@/lib/trips/server";
import { AMOUNT_SCALE } from "@/lib/trips/money";
import { deleteTripObject, getTripS3 } from "@/lib/trips/s3";

interface RouteContext {
  params: Promise<{ id: string; expenseId: string }>;
}

async function resolveIds(params: RouteContext["params"]) {
  const p = await params;
  return { tripId: parseId(p.id), expenseId: parseId(p.expenseId) };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId } = session.user;
  const { tripId, expenseId } = await resolveIds(params);
  const existing =
    tripId && expenseId ? await getMemberExpense(memberId, tripId, expenseId) : null;
  if (!tripId || !expenseId || !existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = expenseInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  const newAttachments = await getLinkableAttachments(memberId, tripId, input.attachmentIds ?? []);
  const linked = await getDb()
    .select({ type: moneturaTripAttachments.type })
    .from(moneturaTripAttachments)
    .where(
      and(
        eq(moneturaTripAttachments.expenseId, expenseId),
        eq(moneturaTripAttachments.memberId, memberId)
      )
    );
  const evidenceProblem = missingEvidence(input, [...linked, ...newAttachments]);
  if (evidenceProblem) {
    return NextResponse.json({ error: evidenceProblem }, { status: 400 });
  }

  // "keep" is only honoured when nothing that feeds the conversion changed —
  // otherwise the stored rate would no longer describe this expense.
  const conversionInputsUnchanged =
    input.currency === existing.currency &&
    input.expenseDate === existing.expenseDate &&
    sameDecimal(input.amount, existing.amount, AMOUNT_SCALE);
  let fxValues: {
    exchangeRate: string;
    rateSource: typeof existing.rateSource;
    rateDate: string | null;
    cadAmount: string;
  };
  if (input.fx.mode === "keep") {
    if (!conversionInputsUnchanged) {
      return NextResponse.json(
        { error: "Amount, currency or date changed — choose how to convert to CAD again", code: "RATE_REQUIRED" },
        { status: 422 }
      );
    }
    fxValues = {
      exchangeRate: existing.exchangeRate,
      rateSource: existing.rateSource,
      rateDate: existing.rateDate,
      cadAmount: existing.cadAmount,
    };
  } else {
    const fx = await resolveFx(input.amount, input.currency, input.expenseDate, input.fx);
    if (!fx.ok) {
      return NextResponse.json({ error: fx.error, code: fx.code }, { status: fx.status });
    }
    fxValues = fx;
  }

  const needsAudit = Date.now() - existing.createdAt.getTime() > AUDIT_GRACE_MS;

  try {
    await getDb().transaction(async (tx) => {
      if (needsAudit) {
        await tx.insert(moneturaTripExpenseRevisions).values({
          expenseId,
          memberId,
          previousValues: snapshotExpense(existing),
        });
      }
      await tx
        .update(moneturaTripExpenses)
        .set({
          expenseDate: input.expenseDate,
          vendorName: input.vendorName,
          description: input.description || null,
          category: input.category,
          amount: input.amount,
          currency: input.currency,
          exchangeRate: fxValues.exchangeRate,
          rateSource: fxValues.rateSource,
          rateDate: fxValues.rateDate,
          cadAmount: fxValues.cadAmount,
          paymentMethod: input.paymentMethod,
          evidenceType: input.evidenceType,
          vendorSignerName: input.vendorSignerName || null,
          businessPurpose: input.businessPurpose || null,
          businessUsePercent: input.businessUsePercent,
          aiAssisted: existing.aiAssisted || (input.aiAssisted ?? false),
        })
        .where(
          and(eq(moneturaTripExpenses.id, expenseId), eq(moneturaTripExpenses.memberId, memberId))
        );
      if (newAttachments.length > 0) {
        await tx
          .update(moneturaTripAttachments)
          .set({ expenseId })
          .where(
            and(
              inArray(moneturaTripAttachments.id, newAttachments.map((a) => a.id)),
              eq(moneturaTripAttachments.memberId, memberId)
            )
          );
      }
    });
  } catch (err) {
    console.error("[trips/expenses] Update failed:", err);
    return NextResponse.json({ error: "Could not save the expense" }, { status: 500 });
  }

  return NextResponse.json({ success: true, audited: needsAudit, cadAmount: fxValues.cadAmount });
}

/** Deletes the expense, its audit history and its files. The UI confirms first. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId } = session.user;
  const { tripId, expenseId } = await resolveIds(params);
  const existing =
    tripId && expenseId ? await getMemberExpense(memberId, tripId, expenseId) : null;
  if (!expenseId || !existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const files = await getDb()
    .select()
    .from(moneturaTripAttachments)
    .where(
      and(eq(moneturaTripAttachments.expenseId, expenseId), eq(moneturaTripAttachments.memberId, memberId))
    );

  await getDb().transaction(async (tx) => {
    await tx
      .delete(moneturaTripAttachments)
      .where(
        and(eq(moneturaTripAttachments.expenseId, expenseId), eq(moneturaTripAttachments.memberId, memberId))
      );
    await tx
      .delete(moneturaTripExpenseRevisions)
      .where(
        and(
          eq(moneturaTripExpenseRevisions.expenseId, expenseId),
          eq(moneturaTripExpenseRevisions.memberId, memberId)
        )
      );
    await tx
      .delete(moneturaTripExpenses)
      .where(and(eq(moneturaTripExpenses.id, expenseId), eq(moneturaTripExpenses.memberId, memberId)));
  });

  // Storage cleanup after the rows are gone; a failed object delete leaves an
  // unreachable file, never a record pointing at nothing.
  const s3 = getTripS3();
  if (s3) await Promise.all(files.map((f) => deleteTripObject(s3, f.s3Bucket, f.s3Key)));

  return NextResponse.json({ success: true });
}
