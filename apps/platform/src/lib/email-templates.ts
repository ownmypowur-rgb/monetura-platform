// Branded transactional email HTML — Monetura visual language.
// Simple, table-based, email-client-safe markup:
// warm charcoal (#2C2420) background, champagne gold (#D4A853) button,
// desert cream (#FBF5ED) text.

const CHARCOAL = "#2C2420";
const CHARCOAL_DEEP = "#1A1410";
const GOLD = "#D4A853";
const CREAM = "#FBF5ED";
const SAND = "#E8DCCB";
const EARTH = "#8B6E52";
const MOCHA = "#4A3728";

export interface BrandedEmailOptions {
  heading: string;
  /** Plain-text paragraphs — escaped automatically. */
  paragraphs: string[];
  /** Optional key-detail lines rendered in a highlighted panel (e.g. payment reference). */
  panelLines?: string[];
  /** Optional prominent gold call-to-action button. */
  button?: { label: string; url: string };
  /** Small print under the button. */
  footerNote?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Base URL of the platform app, for links embedded in emails. */
export function appBaseUrl(): string {
  return (
    process.env["NEXT_PUBLIC_APP_URL"] ??
    process.env["NEXTAUTH_URL"] ??
    "https://monetura-platform-app.vercel.app"
  );
}

export function brandedEmailHtml(opts: BrandedEmailOptions): string {
  const paragraphs = opts.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px 0;color:${SAND};font-size:15px;line-height:24px;">${escapeHtml(p)}</p>`
    )
    .join("\n");

  const panel = opts.panelLines?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0;">
        <tr><td style="background:${CHARCOAL_DEEP};border:1px solid ${MOCHA};border-radius:8px;padding:16px 20px;">
          ${opts.panelLines
            .map(
              (l) =>
                `<p style="margin:4px 0;color:${CREAM};font-size:14px;line-height:22px;">${escapeHtml(l)}</p>`
            )
            .join("\n")}
        </td></tr>
      </table>`
    : "";

  const button = opts.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0;">
        <tr><td style="border-radius:8px;background:${GOLD};">
          <a href="${opts.button.url}" target="_blank"
             style="display:inline-block;padding:14px 32px;color:${CHARCOAL};font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:8px;">
            ${escapeHtml(opts.button.label)}
          </a>
        </td></tr>
      </table>`
    : "";

  const footerNote = opts.footerNote
    ? `<p style="margin:0 0 16px 0;color:${EARTH};font-size:12px;line-height:18px;">${escapeHtml(opts.footerNote)}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:${CHARCOAL};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CHARCOAL};">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
        <tr><td style="padding-bottom:28px;" align="center">
          <span style="color:${GOLD};font-size:18px;font-weight:bold;letter-spacing:6px;">MONETURA</span>
        </td></tr>
        <tr><td style="background:${CHARCOAL};border:1px solid ${MOCHA};border-radius:12px;padding:36px 32px;">
          <h1 style="margin:0 0 20px 0;color:${CREAM};font-size:24px;font-weight:normal;line-height:32px;">${escapeHtml(opts.heading)}</h1>
          ${paragraphs}
          ${panel}
          ${button}
          ${footerNote}
          <p style="margin:0;color:${SAND};font-size:15px;line-height:24px;">— The Monetura Team</p>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;color:${EARTH};font-size:11px;letter-spacing:1px;">MONETURA — PASSION BECOMES CREATION. CREATION BECOMES FREEDOM.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
