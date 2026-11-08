import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listPendingWaitlistConfirmations } from "@monetura/db";
import { sendWaitlistConfirmation } from "@/lib/waitlist-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sends the confirmation to subscribed signups that never got one. Admin only. */
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.memberTier !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const mailingAddress = process.env["MONETURA_MAILING_ADDRESS"];
  if (!mailingAddress || !process.env["RESEND_API_KEY"]) {
    return NextResponse.json(
      { error: "MONETURA_MAILING_ADDRESS and RESEND_API_KEY must both be set." },
      { status: 409 }
    );
  }

  const pending = await listPendingWaitlistConfirmations();
  let sent = 0;
  for (const row of pending) {
    if (await sendWaitlistConfirmation(row, mailingAddress)) sent++;
  }
  return NextResponse.json({ attempted: pending.length, sent });
}
