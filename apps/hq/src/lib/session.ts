/**
 * Owner session cookie. Web Crypto only, so it is safe in Edge middleware.
 * Must never import the database client or mysql2.
 *
 * Token format: `<expiresAtMs>.<base64url hmac-sha256 of expiresAtMs>`
 */
export const SESSION_COOKIE = "hq_owner";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

/** Constant-time string comparison, usable on the Edge. */
export function safeEqual(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}

export async function createSessionToken(secret: string, now = Date.now()): Promise<string> {
  const expires = String(now + SESSION_MAX_AGE_SECONDS * 1000);
  return `${expires}.${await hmac(secret, expires)}`;
}

/** Fails closed: no secret or a malformed token is simply not a session. */
export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now(),
): Promise<boolean> {
  if (!token || !secret) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expires = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;
  return safeEqual(signature, await hmac(secret, expires));
}
