import { Resend } from "resend";

// Singleton — created once per cold start
let _resend: Resend | null = null;

export function getResend(): Resend {
  if (_resend) return _resend;
  const key = process.env["RESEND_API_KEY"];
  if (!key) throw new Error("RESEND_API_KEY environment variable is required");
  _resend = new Resend(key);
  return _resend;
}
