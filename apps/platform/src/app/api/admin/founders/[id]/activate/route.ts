import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  getDb,
  moneturaMembers,
  moneturaFounderKeys,
  createPasswordToken,
} from "@monetura/db";
import { eq, max } from "drizzle-orm";
import { getResend } from "@/lib/resend";
import { apexcrmUsers } from "@/lib/apexcrm-users";
import { appBaseUrl, brandedEmailHtml } from "@/lib/email-templates";

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

  // Resolve the email base URL up front. appBaseUrl() throws when the app URL
  // is not configured; failing here means the member is untouched, rather than
  // being activated and then 500-ing on the welcome email.
  let baseUrl: string;
  try {
    baseUrl = appBaseUrl();
  } catch (err) {
    console.error("[activate] Cannot build email links:", err);
    return NextResponse.json(
      { error: "Server email configuration is incomplete. Activation aborted." },
      { status: 500 }
    );
  }

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

  // Map tier interest to founder key tier
  const effectiveTier = body.tierOverride ?? member.tierInterest ?? "entry";
  const founderKeyTier: "bronze" | "silver" | "gold" =
    effectiveTier === "platinum" || effectiveTier === "elite"
      ? "gold"
      : effectiveTier === "core"
      ? "silver"
      : "bronze";

  // Assign the founder number, flip the member to active, and mint the founder
  // key as one atomic unit. The number is derived from MAX(founder_number) + 1,
  // so two admins activating at the same moment could previously hand out the
  // same number — the SELECT … FOR UPDATE serializes them, and the transaction
  // means a mid-way failure never leaves an active member without a key.
  let founderNumber: number;
  try {
    founderNumber = await db.transaction(async (tx) => {
      const result = await tx
        .select({ maxNumber: max(moneturaMembers.founderNumber) })
        .from(moneturaMembers)
        .for("update");
      const nextNumber = (result[0]?.maxNumber ?? 0) + 1;

      const keyCode = `FOUNDER-${String(nextNumber).padStart(4, "0")}-${Date.now().toString(36).toUpperCase()}`;

      await tx
        .update(moneturaMembers)
        .set({
          status: "active",
          membershipTier: "founder",
          founderNumber: nextNumber,
        })
        .where(eq(moneturaMembers.id, memberId));

      await tx.insert(moneturaFounderKeys).values({
        memberId,
        keyCode,
        founderTier: founderKeyTier,
        activatedAt: new Date(),
      });

      return nextNumber;
    });
  } catch (err) {
    console.error("[activate] Activation failed, rolled back:", err);
    return NextResponse.json(
      { error: "Activation failed. The member was not changed — please retry." },
      { status: 500 }
    );
  }

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

  // Create a set-password token so the founder can actually sign in.
  // The application form creates the ApexCRM user without a password hash;
  // look it up (create defensively if missing) and attach a token to it.
  let setPasswordUrl: string | null = null;
  try {
    const users = await db
      .select({ id: apexcrmUsers.id })
      .from(apexcrmUsers)
      .where(eq(apexcrmUsers.email, member.email))
      .limit(1);

    let userId = users[0]?.id ?? null;
    if (userId === null) {
      await db.insert(apexcrmUsers).values({
        openId: `local:${member.email}`,
        email: member.email,
        name: member.name,
        loginMethod: "credentials",
        role: "user",
      });
      const created = await db
        .select({ id: apexcrmUsers.id })
        .from(apexcrmUsers)
        .where(eq(apexcrmUsers.email, member.email))
        .limit(1);
      userId = created[0]?.id ?? null;
    }

    if (userId !== null) {
      const token = await createPasswordToken(userId, "set_password");
      setPasswordUrl = `${baseUrl}/set-password?token=${token}`;
    }
  } catch (err) {
    console.error("Set-password token creation failed (non-blocking):", err);
  }

  // Send branded welcome email with the set-password call to action.
  const resend = getResend();
  const { error: emailError } = await resend.emails.send({
    from: "Monetura <noreply@monetura.com>",
    to: member.email,
    subject: `Welcome to Monetura — You're Founder #${founderNumber}`,
    html: brandedEmailHtml({
      heading: `Welcome, Founder #${founderNumber}`,
      paragraphs: [
        `Hi ${member.name},`,
        "Your founding membership is now active. One step remains: choose the password for your member dashboard.",
      ],
      button: setPasswordUrl
        ? { label: "Choose Your Password", url: setPasswordUrl }
        : { label: "Go to Your Dashboard", url: `${baseUrl}/login` },
      footerNote: setPasswordUrl
        ? "This link is valid for 7 days. If it expires, use “Forgot your password?” on the sign-in page."
        : undefined,
    }),
  });

  if (emailError) {
    console.error("Resend welcome email error:", emailError);
  }

  return NextResponse.json({ success: true, founderNumber });
}
