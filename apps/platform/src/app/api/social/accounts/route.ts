import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBundleAccounts } from "@monetura/db";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId } = session.user;

  try {
    const accounts = await getBundleAccounts(memberId);
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("[social/accounts] Failed to fetch accounts:", error);
    return NextResponse.json({ accounts: [] });
  }
}
