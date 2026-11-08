import type { Metadata } from "next";
import UnsubscribeButton from "./UnsubscribeButton";

export const metadata: Metadata = {
  title: "Unsubscribe: Monetura",
  robots: { index: false, follow: false },
  alternates: { canonical: "/waitlist/unsubscribe" },
};

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string | string[] };
}) {
  const raw = searchParams.token;
  const token = typeof raw === "string" ? raw : "";

  return (
    <main className="bg-monetura-charcoal min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center py-40">
        <p className="editorial-label justify-center">Monetura</p>
        <UnsubscribeButton token={token} />
      </div>
    </main>
  );
}
