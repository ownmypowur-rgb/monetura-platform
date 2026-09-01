import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb, moneturaMembers } from "@monetura/db";
import { eq } from "drizzle-orm";
import { getResend } from "@/lib/resend";
import { brandedEmailHtml } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

const ParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "id must be numeric"),
});

export async function POST(
  _req: Request,
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

  const memberId = parseInt(parsed.data.id, 10);
  const db = getDb();

  // Fetch the member
  const members = await db
    .select({
      id: moneturaMembers.id,
      name: moneturaMembers.name,
      email: moneturaMembers.email,
      status: moneturaMembers.status,
    })
    .from(moneturaMembers)
    .where(eq(moneturaMembers.id, memberId))
    .limit(1);

  const member = members[0];
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (member.status !== "pending") {
    return NextResponse.json(
      { error: "Member is not in pending status" },
      { status: 400 }
    );
  }

  // Update status to awaiting_payment
  await db
    .update(moneturaMembers)
    .set({ status: "awaiting_payment" })
    .where(eq(moneturaMembers.id, memberId));

  // Format reference code: MTR-0042
  const reference = `MTR-${String(memberId).padStart(4, "0")}`;

  // Send branded email via Resend
  const resend = getResend();
  const { error: emailError } = await resend.emails.send({
    from: "Monetura <noreply@monetura.com>",
    to: member.email,
    subject: "Your Monetura Founder Application — Payment Instructions",
    html: brandedEmailHtml({
      heading: "Secure your founding spot",
      paragraphs: [
        `Hi ${member.name},`,
        "Thank you for your interest in founding membership. To secure your spot, please send your e-transfer using the details below.",
      ],
      panelLines: [
        "E-transfer to: payments@monetura.com",
        `Reference: ${reference}`,
      ],
      footerNote:
        "ATB Bank accepts e-transfers up to $10,000 per transaction — for larger amounts, reply for wire instructions. Your spot will be held for 7 days. Questions? Just reply to this email.",
    }),
  });

  if (emailError) {
    console.error("Resend error:", emailError);
    // Don't fail the request — status already updated
  }

  return NextResponse.json({ success: true });
}
