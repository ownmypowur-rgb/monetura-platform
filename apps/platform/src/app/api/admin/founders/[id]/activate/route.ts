import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb, moneturaMembers, moneturaFounderKeys } from "@monetura/db";
import { eq, max } from "drizzle-orm";
import { getResend } from "@/lib/resend";

export const dynamic = "force-dynamic";

const ParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "id must be numeric"),
});

const BodySchema = z.object({
  tierOverride: z
    .enum(["entry", "core", "elite", "platinum"])
    .optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.memberTier !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid member id" }, { status: 400 });
  }

  let body: z.infer<typeof BodySchema> = {};
  try {
    const raw: unknown = await req.json();
    const bodyParsed = BodySchema.safeParse(raw);
    if (bodyParsed.success) body = bodyParsed.data;
  } catch {
    // Empty body is fine
  }

  const memberId = parseInt(parsed.data.id, 10);
  const db = getDb();

  // Fetch member
  const members = await db
    .select({
      id: moneturaMembers.id,
      name: moneturaMembers.name,
      email: moneturaMembers.email,
      status: moneturaMembers.status,
      tierInterest: moneturaMembers.tierInterest,
    })
    .from(moneturaMembers)
    .where(eq(moneturaMembers.id, memberId))
    .limit(1);

  const member = members[0];
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (member.status !== "awaiting_payment") {
    return NextResponse.json(
      { error: "Member is not in awaiting_payment status" },
      { status: 400 }
    );
  }

  // Determine next founder number
  const result = await db
    .select({ maxNumber: max(moneturaMembers.founderNumber) })
    .from(moneturaMembers);
  const currentMax = result[0]?.maxNumber ?? 0;
  const founderNumber = (currentMax ?? 0) + 1;

  // Map tier interest to founder key tier
  const effectiveTier = body.tierOverride ?? member.tierInterest ?? "entry";
  const founderKeyTier: "bronze" | "silver" | "gold" =
    effectiveTier === "platinum" || effectiveTier === "elite"
      ? "gold"
      : effectiveTier === "core"
      ? "silver"
      : "bronze";

  // Generate unique key code
  const keyCode = `FOUNDER-${String(founderNumber).padStart(4, "0")}-${Date.now().toString(36).toUpperCase()}`;

  // Update monetura_members
  await db
    .update(moneturaMembers)
    .set({
      status: "active",
      membershipTier: "founder",
      founderNumber,
    })
    .where(eq(moneturaMembers.id, memberId));

  // Insert founder key record
  await db.insert(moneturaFounderKeys).values({
    memberId,
    keyCode,
    founderTier: founderKeyTier,
    activatedAt: new Date(),
  });

  // Fire n8n WF-01 webhook (fire and forget — never await)
  const n8nBase = process.env["N8N_WEBHOOK_BASE_URL"];
  if (n8nBase) {
    fetch(`${n8nBase}/webhook/founder-activated`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId,
        founderNumber,
        memberTier: effectiveTier,
        email: member.email,
        name: member.name,
      }),
    }).catch((err: unknown) => {
      console.error("n8n WF-01 webhook failed (non-blocking):", err);
    });
  } else {
    console.log(
      "N8N_WEBHOOK_BASE_URL not set — skipping founder-activated webhook"
    );
  }

  // Send welcome email
  const resend = getResend();
  const { error: emailError } = await resend.emails.send({
    from: "Monetura <noreply@monetura.com>",
    to: member.email,
    subject: `Welcome to Monetura — You're Founder #${founderNumber}`,
    text: `Hi ${member.name},

Welcome to Monetura. Your founding membership is now active.

You are Founder #${founderNumber}.

Sign in to your member dashboard at app.monetura.com

The Monetura Team`,
  });

  if (emailError) {
    console.error("Resend welcome email error:", emailError);
  }

  return NextResponse.json({ success: true, founderNumber });
}
