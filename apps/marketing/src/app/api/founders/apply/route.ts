import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import {
  getDb,
  moneturaMembers,
  checkRateLimit,
  getClientIp,
} from "@monetura/db";
import { apexcrmUsers } from "@/lib/apexcrm-users";
import { eq } from "drizzle-orm";
import { founderTierById, formatTierPrice } from "@monetura/config/src/tiers";
import { brandedEmailHtml } from "@monetura/config/src/email";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2).max(255).trim(),
  email: z.string().email().max(320).trim().toLowerCase(),
  phone: z.string().min(7).max(50).trim(),
  province: z.enum([
    "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
  ]),
  tier: z.enum(["explorer", "trailblazer", "pioneer", "luminary"]),
  referral: z.string().max(500).trim().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rl = checkRateLimit(
    `founders-apply:${getClientIp(request)}`,
    5,
    60 * 60 * 1000
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

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

    const tierDef = founderTierById(tier);
    if (existing.length === 0) {
      await db.insert(moneturaMembers).values({
        email,
        name,
        phone,
        membershipTier: "founder",
        status: "pending",
        province,
        tierInterest: tierDef?.tierInterest ?? "entry",
        heardAbout: referral ?? null,
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
      const tierDef = founderTierById(tier);
      const tierLabel = tierDef
        ? `${tierDef.name} (${formatTierPrice(tierDef)} CAD)`
        : tier;

      // brandedEmailHtml escapes every value it is given. The applicant's name,
      // phone and referral text are unauthenticated public input and must never
      // be interpolated into HTML by hand.
      await resend.emails.send({
        from: "noreply@monetura.com",
        to: ownerEmail,
        subject: `New Webinar Request — ${name} — Interested in ${tierDef?.name ?? tier}`,
        html: brandedEmailHtml({
          heading: "New Founder Webinar Request",
          paragraphs: ["A new application came in through monetura.com/founders/apply."],
          panelLines: [
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${phone}`,
            `Province: ${province}`,
            `Tier Interest: ${tierLabel}`,
            `Referral Source: ${referral ?? "—"}`,
          ],
          footerNote: "Submitted via monetura.com/founders/apply",
        }),
      });
    } catch (err) {
      console.error("Resend email error:", err);
      // Non-fatal — form submission succeeded even if email fails
    }
  }

  return NextResponse.json({ success: true });
}
