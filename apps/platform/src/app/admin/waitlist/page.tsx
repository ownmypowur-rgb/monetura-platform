import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getWaitlistStats, listWaitlist } from "@monetura/db";
import { WaitlistClient, type WaitlistListRow } from "./WaitlistClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await auth();
  if (!session?.user || session.user.memberTier !== "admin") {
    redirect("/dashboard");
  }

  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const [stats, rows] = await Promise.all([
    getWaitlistStats(),
    listWaitlist({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
  ]);

  // Only what the table shows: no tokens, no consent internals, no IP hash.
  const list: WaitlistListRow[] = rows.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    email: r.email,
    status: r.status,
    joined: r.createdAt.toISOString(),
    confirmationSent: r.confirmationSentAt ? r.confirmationSentAt.toISOString() : null,
    utmSource: r.utmSource,
    utmMedium: r.utmMedium,
    utmCampaign: r.utmCampaign,
    referrer: r.referrer,
  }));

  const total = stats.subscribed + stats.unsubscribed;
  const missing = [
    !process.env["MONETURA_MAILING_ADDRESS"] && "MONETURA_MAILING_ADDRESS",
    !process.env["RESEND_API_KEY"] && "RESEND_API_KEY",
  ].filter((v): v is string => Boolean(v));

  return (
    <WaitlistClient
      stats={stats}
      rows={list}
      page={page}
      hasNext={page * PAGE_SIZE < total}
      sendBlockedReason={missing.length ? `Set ${missing.join(" and ")} on this project to send.` : null}
    />
  );
}
