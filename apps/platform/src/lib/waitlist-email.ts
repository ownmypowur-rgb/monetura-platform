import "server-only";
import { markWaitlistConfirmationSent, type WaitlistRow } from "@monetura/db";
import { buildWaitlistConfirmationEmail } from "@monetura/config/src/waitlist";
import { getResend } from "@/lib/resend";

/**
 * Same message as the marketing signup (template and wording live in
 * @monetura/config/src/waitlist). Never throws; never logs the address.
 */
export async function sendWaitlistConfirmation(row: WaitlistRow, mailingAddress: string): Promise<boolean> {
  try {
    const msg = buildWaitlistConfirmationEmail({
      firstName: row.firstName,
      unsubscribeToken: row.unsubscribeToken,
      mailingAddress,
    });
    const { error } = await getResend().emails.send({
      from: msg.from,
      to: row.email,
      reply_to: msg.replyTo,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      headers: msg.headers,
    });
    if (error) {
      console.warn(`[waitlist] confirmation not accepted for row ${row.id}: ${error.name}`);
      return false;
    }
    await markWaitlistConfirmationSent(row.id);
    return true;
  } catch (err) {
    console.warn(`[waitlist] confirmation failed for row ${row.id}: ${err instanceof Error ? err.message : "unknown"}`);
    return false;
  }
}
