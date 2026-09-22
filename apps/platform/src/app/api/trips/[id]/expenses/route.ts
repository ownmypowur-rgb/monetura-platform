import "server-only";
import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, moneturaTripExpenses, moneturaTripAttachments } from "@monetura/db";
import {
  expenseInputSchema,
  firstIssue,
  getLinkableAttachments,
  getMemberTrip,
  insertedId,
  missingEvidence,
  parseId,
  resolveFx,
} from "@/lib/trips/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId } = session.user;
  const tripId = parseId((await params).id);
  if (!tripId || !(await getMemberTrip(memberId, tripId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = expenseInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;
  if (input.fx.mode === "keep") {
    return NextResponse.json({ error: "Choose how to convert to CAD" }, { status: 400 });
  }

  const attachments = await getLinkableAttachments(memberId, tripId, input.attachmentIds ?? []);
  const evidenceProblem = missingEvidence(input, attachments);
  if (evidenceProblem) {
    return NextResponse.json({ error: evidenceProblem }, { status: 400 });
  }

  const fx = await resolveFx(input.amount, input.currency, input.expenseDate, input.fx);
  if (!fx.ok) {
    return NextResponse.json({ error: fx.error, code: fx.code }, { status: fx.status });
  }

  try {
    const expenseId = await getDb().transaction(async (tx) => {
      const result = await tx
        .insert(moneturaTripExpenses)
        .values({
          memberId,
          tripId,
          expenseDate: input.expenseDate,
          vendorName: input.vendorName,
          description: input.description || null,
          category: input.category,
          amount: input.amount,
          currency: input.currency,
          exchangeRate: fx.exchangeRate,
          rateSource: fx.rateSource,
          rateDate: fx.rateDate,
          cadAmount: fx.cadAmount,
          paymentMethod: input.paymentMethod,
          evidenceType: input.evidenceType,
          vendorSignerName: input.vendorSignerName || null,
          businessPurpose: input.businessPurpose || null,
          businessUsePercent: input.businessUsePercent,
          aiAssisted: input.aiAssisted ?? false,
        });
      const id = insertedId(result);
      if (attachments.length > 0) {
        await tx
          .update(moneturaTripAttachments)
          .set({ expenseId: id })
          .where(
            and(
              inArray(moneturaTripAttachments.id, attachments.map((a) => a.id)),
              eq(moneturaTripAttachments.memberId, memberId)
            )
          );
      }
      return id;
    });
    return NextResponse.json({
      success: true,
      id: expenseId,
      cadAmount: fx.cadAmount,
      exchangeRate: fx.exchangeRate,
      rateSource: fx.rateSource,
      rateDate: fx.rateDate,
    });
  } catch (err) {
    console.error("[trips/expenses] Create failed:", err);
    return NextResponse.json({ error: "Could not save the expense" }, { status: 500 });
  }
}
