import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { getDb, moneturaMembers } from "@monetura/db";
import { apexcrmUsers } from "@/lib/apexcrm-users";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2).max(255).trim(),
  email: z.string().email().max(320).trim().toLowerCase(),
  phone: z.string().min(7).max(50).trim(),
  province: z.enum([
    "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
  ]),
  tier: z.enum([
    "Entry Founder",
    "Core Founder",
    "Elite Founder",
    "Platinum Founder",
  ]),
  referral: z.string().max(500).trim().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const { name, email, phone, province, tier, referral } = parsed.data;
  const db = getDb();

  // ── 1. Upsert monetura_members (pending founder) ──────────────────────────
  try {
    const existing = await db
      .select({ id: moneturaMembers.id })
      .from(moneturaMembers)
      .where(eq(moneturaMembers.email, email))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(moneturaMembers).values({
        email,
        name,
        phone,
        membershipTier: "founder",
        status: "pending",
        city: province,
      });
    }
  } catch (err) {
    console.error("monetura_members insert error:", err);
    // Continue — don't block on duplicate
  }

  // ── 2. Create ApexCRM user if email not exists ────────────────────────────
  try {
    const existingApex = await db
      .select({ id: apexcrmUsers.id })
      .from(apexcrmUsers)
      .where(eq(apexcrmUsers.email, email))
      .limit(1);

    if (existingApex.length === 0) {
      await db.insert(apexcrmUsers).values({
        openId: `local:${email}`,
        email,
        name,
        loginMethod: "credentials",
        role: "user",
      });
    }
  } catch (err) {
    console.error("ApexCRM user insert error:", err);
    // Non-fatal — member record is what matters
  }

  // ── 3. Send notification email ────────────────────────────────────────────
  const resendKey = process.env["RESEND_API_KEY"];
  const ownerEmail = process.env["OWNER_EMAIL"] ?? "founders@monetura.com";

  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "noreply@monetura.com",
        to: ownerEmail,
        subject: `New Webinar Request — ${name} — Interested in ${tier}`,
        html: `
          <h2>New Founder Webinar Request</h2>
          <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
            <tr><td><strong>Name</strong></td><td>${name}</td></tr>
            <tr><td><strong>Email</strong></td><td>${email}</td></tr>
            <tr><td><strong>Phone</strong></td><td>${phone}</td></tr>
            <tr><td><strong>Province</strong></td><td>${province}</td></tr>
            <tr><td><strong>Tier Interest</strong></td><td>${tier}</td></tr>
            <tr><td><strong>Referral Source</strong></td><td>${referral ?? "—"}</td></tr>
          </table>
          <p style="margin-top:20px;color:#888;font-size:12px;">
            Submitted via monetura.com/founders/apply
          </p>
        `,
      });
    } catch (err) {
      console.error("Resend email error:", err);
      // Non-fatal — form submission succeeded even if email fails
    }
  }

  return NextResponse.json({ success: true });
}
