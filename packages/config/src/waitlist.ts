// Waitlist: the single source for the consent wording and the confirmation
// email, shared by apps/marketing (signup) and apps/platform (admin resend).
// Copy brand-checked Nov 8, 2026 (monetura-hq sprints/…waitlist….brand-check.md).

import { brandedEmailHtml } from "./email";

/** Exact checkbox wording. Stored with every signup as proof of consent (CASL). */
export const WAITLIST_CONSENT_TEXT =
  "Yes, Monetura Media & Technologies Inc. may email me about Monetura, including an invitation to the private founders webinar. I can unsubscribe at any time.";

/** Bump when WAITLIST_CONSENT_TEXT changes. */
export const WAITLIST_CONSENT_VERSION = "2026-11-08";

export const WAITLIST_SENDER_NAME = "Monetura Media & Technologies Inc.";
export const WAITLIST_CONTACT_EMAIL = "founders@monetura.com";
export const WAITLIST_FROM = "Darryl at Monetura <founders@monetura.com>";
export const SITE_URL = "https://www.monetura.com";

/**
 * CASL sender identification: name, mailing address, contact email. Accepts a
 * MONETURA_MAILING_ADDRESS with or without the company name in front.
 */
export function waitlistSenderLine(mailingAddress: string): string {
  const addr = mailingAddress.trim();
  const named = addr.startsWith(WAITLIST_SENDER_NAME) ? addr : `${WAITLIST_SENDER_NAME}, ${addr}`;
  return `${named}, ${WAITLIST_CONTACT_EMAIL}`;
}

export function waitlistUnsubscribePageUrl(token: string): string {
  return `${SITE_URL}/waitlist/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function waitlistUnsubscribeApiUrl(token: string): string {
  return `${SITE_URL}/api/waitlist/unsubscribe?token=${encodeURIComponent(token)}`;
}

export interface WaitlistEmail {
  from: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
}

/**
 * The confirmation email. `mailingAddress` is required: CASL needs the sender's
 * mailing address in every commercial message, so callers must not send without it.
 */
export function buildWaitlistConfirmationEmail(input: {
  firstName: string;
  unsubscribeToken: string;
  mailingAddress: string;
}): WaitlistEmail {
  const { firstName, unsubscribeToken, mailingAddress } = input;
  const paragraphs = [
    "Thank you for joining the Monetura waitlist.",
    "Monetura is for people who've spent years living for everyone else and are ready to find their way back: to travel, to each other, and to themselves.",
    "You'll be the first to hear what's coming, including an invitation to our private founders webinar.",
    "Until then, you can follow along on Instagram at @monetura.life.",
  ];
  const signature = ["Darryl", "Founder, Monetura"];
  const footerLines = [
    "You're receiving this because you joined the waitlist at monetura.com and agreed to hear from us.",
    waitlistSenderLine(mailingAddress),
  ];
  const unsubscribeUrl = waitlistUnsubscribePageUrl(unsubscribeToken);

  const html = brandedEmailHtml({
    heading: `Hi ${firstName},`,
    paragraphs,
    preheader: "Something is coming. You'll hear first.",
    signature,
    footerLines,
    unsubscribeUrl,
  });

  const text = [
    `Hi ${firstName},`,
    "",
    ...paragraphs.flatMap((p) => [p, ""]),
    ...signature,
    "",
    "--",
    ...footerLines,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  return {
    from: WAITLIST_FROM,
    replyTo: WAITLIST_CONTACT_EMAIL,
    subject: "You're on the list",
    html,
    text,
    headers: {
      "List-Unsubscribe": `<${waitlistUnsubscribeApiUrl(unsubscribeToken)}>, <mailto:${WAITLIST_CONTACT_EMAIL}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}
