import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBundleConnectUrl } from "@monetura/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId } = session.user;

  const { origin } = new URL(request.url);
  const redirectUrl = `${origin}/settings/social?connected=true`;

  try {
    const portalUrl = await getBundleConnectUrl(memberId, redirectUrl);
    return NextResponse.json({ portalUrl });
  } catch (error) {
    console.error("[social/connect] Failed to generate portal URL:", error);
    return NextResponse.json(
      { error: "Failed to generate connection portal" },
      { status: 500 }
    );
  }
}
