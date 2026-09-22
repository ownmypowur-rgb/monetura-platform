// Shared Trip Records UI primitives. Colours follow the Sprint 9 contrast
// rules: body text cream, secondary #C4A882, labels #B99B74 — all ≥4.5:1 on
// the #1A0F0A / #2C2420 surfaces. Inputs are 16px so iOS Safari doesn't zoom.
import Link from "next/link";

export const inputClass =
  "w-full rounded-xl bg-monetura-charcoal border border-monetura-mocha px-4 py-3 text-base text-monetura-cream placeholder:text-[#A8916F] focus:outline-none focus:border-monetura-champagne disabled:opacity-60";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold text-monetura-charcoal bg-gradient-to-br from-monetura-terracotta to-monetura-champagne active:scale-[0.98] transition disabled:opacity-50 disabled:active:scale-100";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base text-monetura-sand border border-monetura-mocha bg-transparent active:scale-[0.98] transition disabled:opacity-50";

export const dangerButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base text-[#FCA5A5] border border-[#7F2F2F] bg-transparent active:scale-[0.98] transition disabled:opacity-50";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 py-2 text-sm text-[#C4A882] no-underline"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="15,18 9,12 15,6" />
      </svg>
      {label}
    </Link>
  );
}

export function PageHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#B99B74] mb-1">{eyebrow}</p>
      <h1 className="text-3xl font-semibold leading-tight text-monetura-cream" style={{ fontFamily: "var(--font-heading)" }}>
        {title}
      </h1>
      {children}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-bold tracking-[0.15em] uppercase text-[#B99B74] mb-2">
        {label}
        {required && <span className="text-monetura-champagne"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-sm text-[#C4A882]">{hint}</p>}
      {error && <p className="mt-1.5 text-sm text-[#FCA5A5]">{error}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-monetura-charcoal border border-monetura-mocha ${className}`}>{children}</div>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-[#7F2F2F] bg-[rgba(220,38,38,0.1)] px-4 py-3 text-sm text-[#FCA5A5]">
      {message}
    </div>
  );
}

/** Formats a YYYY-MM-DD date without letting the viewer's timezone shift it. */
export function formatDay(isoDate: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", year: "numeric" }): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-CA", { ...opts, timeZone: "UTC" }).format(d);
}

export function formatDateRange(start: string, end: string): string {
  if (start === end) return formatDay(start, { month: "short", day: "numeric", year: "numeric" });
  return `${formatDay(start, { month: "short", day: "numeric" })} – ${formatDay(end, { month: "short", day: "numeric", year: "numeric" })}`;
}

/** Today's date in the viewer's own timezone, as YYYY-MM-DD. */
export function localToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
