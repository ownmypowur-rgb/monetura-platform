import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Owner login · Monetura HQ", robots: { index: false } };

const ERRORS: Record<string, string> = {
  invalid: "That password isn't right.",
  rate: "Too many attempts. Try again in 15 minutes.",
  config: "Owner login isn't configured yet. Set HQ_OWNER_PASSWORD and HQ_SESSION_SECRET.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const error = searchParams.error ? ERRORS[searchParams.error] : undefined;
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#2C2420] px-4 text-[#FBF5ED]">
      <form
        method="post"
        action="/api/hq/login"
        className="glass w-full max-w-sm rounded-2xl p-8 flex flex-col gap-5"
      >
        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-[#D4A853]">Monetura</p>
          <h1 className="font-display text-3xl mt-1">Corporate Headquarters</h1>
          <p className="text-sm text-[#E8DCCB] mt-2">Private owner view. Sign in to continue.</p>
        </div>
        <input type="hidden" name="next" value={searchParams.next ?? "/"} />
        <label className="flex flex-col gap-1.5 text-sm">
          Password
          <input
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            className="rounded-lg bg-[#2C2420] border border-[#8B6E52] px-3 py-2 text-[#FBF5ED] focus:border-[#D4A853]"
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-[#F0B48A]">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="rounded-lg bg-[#D4A853] py-2.5 font-semibold text-[#2C2420] hover:bg-[#E0B968]"
        >
          Enter headquarters
        </button>
        <Link href="/tour" className="text-center text-sm text-[#E8DCCB] underline underline-offset-4">
          Take the public tour instead
        </Link>
      </form>
    </main>
  );
}
