import "server-only";
import { Resend } from "resend";
import { markWaitlistConfirmationSent, type WaitlistRow } from "@monetura/db";
import { buildWaitlistConfirmationEmail } from "@monetura/config/src/waitlist";

/**
 * Sends the confirmation email and records it. Never throws: a failed send leaves
 * confirmation_sent_at null so /admin/waitlist can resend it. Never logs the address.
 */
export async function sendWaitlistConfirmation(row: WaitlistRow, mailingAddress: string): Promise<boolean> {
  const key = process.env["RESEND_API_KEY"];
  if (!key) {
    console.warn("[waitlist] RESEND_API_KEY not set; confirmation left pending");
    return false;
  }
  try {
    const msg = buildWaitlistConfirmationEmail({
      firstName: row.firstName,
      unsubscribeToken: row.unsubscribeToken,
      mailingAddress,
    });
    const { error } = await new Resend(key).emails.send({
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
