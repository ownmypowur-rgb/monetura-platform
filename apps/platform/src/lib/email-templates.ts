// Platform email helpers.
//
// The branded HTML templates live in @monetura/config so the marketing site can
// use the exact same markup and escaping — import them from here or from the
// package directly; both are the same module.
export {
  escapeHtml,
  brandedEmailHtml,
  type BrandedEmailOptions,
} from "@monetura/config/src/email";

/**
 * Base URL of the platform app, for links embedded in emails.
 *
 * Throws when unset. This used to fall back to a Vercel preview domain, which
 * meant a production deploy missing NEXT_PUBLIC_APP_URL would silently mail
 * every founder a set-password link pointing at the wrong host — a failure
 * nobody could see until a member reported a broken link. Failing loudly at
 * send time is the lesser evil.
 */
export function appBaseUrl(): string {
  const url =
    process.env["NEXT_PUBLIC_APP_URL"] ?? process.env["NEXTAUTH_URL"] ?? null;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL (or NEXTAUTH_URL) must be set — email links cannot be built without it."
    );
  }
  return url.replace(/\/+$/, "");
}
