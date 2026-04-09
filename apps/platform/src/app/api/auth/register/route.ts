import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getDb, moneturaMembers, getAffiliateLinkByCode, checkReferralMilestone, recordCommission } from "@monetura/db";
import { apexcrmUsers } from "@/lib/apexcrm-users";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const REFERRAL_COOKIE = "mtr_ref";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  inviteCode: z.string().optional(),
});

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const { name, email, password } = parsed.data;
  const db = getDb();

  // Check if email already exists in monetura_members
  const existing = await db
    .select({ id: moneturaMembers.id })
    .from(moneturaMembers)
    .where(eq(moneturaMembers.email, email))
    .limit(1);

  if (existing[0]) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  // Hash password (12 rounds)
  const passwordHash = await bcrypt.hash(password, 12);

  // Resolve referral code from mtr_ref cookie
  const cookieStore = cookies();
  const refCode = cookieStore.get(REFERRAL_COOKIE)?.value?.trim().toUpperCase() ?? null;

  let referrerLink: Awaited<ReturnType<typeof getAffiliateLinkByCode>> = null;
  if (refCode) {
    try {
      referrerLink = await getAffiliateLinkByCode(refCode);
    } catch (err) {
      console.error("[register] affiliate lookup error:", err);
    }
  }

  // Create ApexCRM user record (required for login via auth.ts)
  const openId = crypto.randomUUID();
  await db.insert(apexcrmUsers).values({
    openId,
    email,
    name,
    passwordHash,
    loginMethod: "credentials",
  });

  // Create monetura_members record
  await db.insert(moneturaMembers).values({
    email,
    name,
    status: "pending",
    referredBy: referrerLink?.code ?? null,
  });

  // Fetch the newly created member record to get the ID
  const newMembers = await db
    .select({ id: moneturaMembers.id })
    .from(moneturaMembers)
    .where(eq(moneturaMembers.email, email))
    .limit(1);

  const newMemberId = newMembers[0]?.id ?? null;

  // Handle referral milestone for the referrer
  if (referrerLink && newMemberId !== null) {
    try {
      const result = await checkReferralMilestone(referrerLink.memberId);

      // Fire milestone only on the exact 3rd active referral
      if (result.milestoneReached && result.referralCount === 3) {
        // Record a milestone commission (free membership — $0 gross, tracked separately)
        await recordCommission(
          referrerLink.memberId,
          "referral_signup",
          0,
          0,
          "Free membership milestone: 3 active referrals",
          newMemberId
        );

        // Fire n8n webhook (fire-and-forget)
        const n8nBase = process.env["N8N_WEBHOOK_BASE_URL"];
        if (n8nBase) {
          fetch(`${n8nBase}/webhook/referral-milestone`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              referrerMemberId: referrerLink.memberId,
              referralCount: result.referralCount,
              newMemberId,
              newMemberEmail: email,
            }),
          }).catch((err: unknown) => {
            console.error("[register] referral-milestone webhook error:", err);
          });
        }
      }
    } catch (err) {
      console.error("[register] milestone check error (non-blocking):", err);
    }
  }

  return NextResponse.json({ success: true });
}
