"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  consentText: string;
  senderLine: string;
}

export default function WaitlistForm({ consentText, senderLine }: Props) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false); // never pre-ticked (CASL)
  const [company, setCompany] = useState(""); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return setError("Please add your first name.");
    if (!EMAIL_RE.test(email.trim())) return setError("Please check your email address.");
    if (!consent) return setError("Please tick the box so we can email you. That’s how the waitlist works.");
    setError(null);
    setSubmitting(true);

    const params = new URLSearchParams(window.location.search);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          email: email.trim(),
          consent: true,
          consentText,
          consentPage: window.location.pathname,
          utmSource: params.get("utm_source") ?? undefined,
          utmMedium: params.get("utm_medium") ?? undefined,
          utmCampaign: params.get("utm_campaign") ?? undefined,
          referrer: document.referrer || undefined,
          company,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again in a moment.");
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="text-center outline-none">
        <p className="lux-heading text-3xl md:text-4xl text-monetura-cream">You&rsquo;re on the list.</p>
        <p className="mt-6 text-base leading-8 text-monetura-cream/75">
          Watch for an email from Darryl. Something is coming, and you&rsquo;ll hear first.
        </p>
      </div>
    );
  }

  const field =
    "w-full bg-transparent border border-monetura-sand/20 text-monetura-cream text-base px-4 py-3 focus:outline-none focus:border-monetura-champagne/60 transition-colors duration-200";

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div>
        <label htmlFor="wl-first-name" className="block mb-2 text-xs uppercase tracking-[0.24em] text-monetura-champagne">
          First name
        </label>
        <input id="wl-first-name" name="firstName" autoComplete="given-name" maxLength={100} value={firstName} onChange={(e) => setFirstName(e.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor="wl-email" className="block mb-2 text-xs uppercase tracking-[0.24em] text-monetura-champagne">
          Email
        </label>
        <input id="wl-email" name="email" type="email" autoComplete="email" maxLength={320} value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      </div>

      {/* Honeypot: hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="wl-company">Company</label>
        <input id="wl-company" name="company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>

      <label className="flex items-start gap-3 text-sm leading-6 text-monetura-cream/80 cursor-pointer">
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 flex-shrink-0 accent-monetura-champagne"
        />
        <span>{consentText}</span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-monetura-terracotta">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
        {submitting ? "Sending…" : "Be the first to know"}
      </button>

      <p className="text-xs leading-5 text-monetura-cream/55">
        {senderLine}.{" "}
        <Link href="/privacy" className="underline hover:text-monetura-champagne">
          Privacy policy
        </Link>
      </p>
    </form>
  );
}
