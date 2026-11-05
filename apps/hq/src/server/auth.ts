import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/** Route handlers and pages re-check the session; middleware is only the first gate. */
export async function hasOwnerSession(): Promise<boolean> {
  return verifySessionToken(cookies().get(SESSION_COOKIE)?.value, process.env["HQ_SESSION_SECRET"]);
}
