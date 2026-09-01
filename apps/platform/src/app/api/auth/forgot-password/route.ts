import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, createPasswordToken } from "@monetura/db";
import { apexcrmUsers } from "@/lib/apexcrm-users";
import { getResend } from "@/lib/resend";
import { appBaseUrl, brandedEmailHtml } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
});

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Validation failed" },
      { status: 422 }
    );
  }

  const email = parsed.data.email.trim();

  // Always return success — never reveal whether an account exists.
  try {
    const users = await getDb()
      .select({ id: apexcrmUsers.id, name: apexcrmUsers.name })
      .from(apexcrmUsers)
      .where(eq(apexcrmUsers.email, email))
      .limit(1);

    const user = users[0];
    if (user) {
      const token = await createPasswordToken(user.id, "reset_password");
      const resetUrl = `${appBaseUrl()}/reset-password?token=${token}`;

      const { error: emailError } = await getResend().emails.send({
        from: "Monetura <noreply@monetura.com>",
        to: email,
        subject: "Reset your Monetura password",
        html: brandedEmailHtml({
          heading: "Reset your password",
          paragraphs: [
            `Hi ${user.name ?? "there"},`,
            "We received a request to reset the password for your Monetura account. Choose a new password using the button below.",
          ],
          button: { label: "Choose a New Password", url: resetUrl },
          footerNote:
            "This link expires in 24 hours. If you didn't request a reset, you can safely ignore this email — your password will not change.",
        }),
      });

      if (emailError) {
        console.error("[forgot-password] Resend error:", emailError);
      }
    }
  } catch (err) {
    // Still return success — the caller must not learn anything from failures.
    console.error("[forgot-password] error:", err);
  }

  return NextResponse.json({ success: true });
}
