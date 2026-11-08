import type { Metadata } from "next";
import { WAITLIST_CONSENT_TEXT, waitlistSenderLine } from "@monetura/config/src/waitlist";
import WaitlistForm from "./WaitlistForm";

// Reads MONETURA_MAILING_ADDRESS at request time (CASL guard below).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Be the first to know: Monetura",
  description:
    "Something is coming for people ready to travel more and find their way back. Join the waitlist to hear first.",
  alternates: { canonical: "/waitlist" },
};

const recognition = [
  "You were never meant to live the same year eighty times and call it a life.",
  "The trips you keep postponing. The friends you keep meaning to go with.",
  "Maybe you don’t need a new life. Maybe you need to find your way back to your own.",
];

export default function WaitlistPage() {
  const mailingAddress = process.env["MONETURA_MAILING_ADDRESS"] ?? "";

  return (
    <main className="bg-monetura-charcoal">
      {/* Hero: the site's own poster frame under a charcoal scrim. */}
      <section className="relative isolate overflow-hidden pt-40 pb-24 sm:pt-48 sm:pb-32">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/hero-poster.jpg)" }}
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-monetura-charcoal/70" />
        <div className="page-shell text-center">
          <h1 className="lux-heading text-5xl md:text-6xl text-monetura-cream">
            Find your way <span className="text-monetura-champagne">back.</span>
          </h1>
          <p className="lux-body mx-auto mt-8 max-w-xl text-base leading-8 text-monetura-cream/80 md:text-lg">
            Something is coming for people who&rsquo;ve spent years living for everyone else.
          </p>
          <a href="#join" className="btn-primary mt-10 inline-flex">
            Be the first to know
          </a>
        </div>
      </section>

      <section className="border-t border-monetura-sand/10 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl px-6 space-y-5 text-center">
          {recognition.map((line) => (
            <p key={line} className="font-garet text-xl leading-relaxed text-monetura-cream md:text-2xl">
              {line}
            </p>
          ))}
        </div>
      </section>

      <section className="bg-monetura-mocha py-20 sm:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className="text-base leading-8 text-monetura-cream/80 md:text-lg">
            Small trips with people who get it, including founder retreats in places like Puerto Vallarta. A
            tribe for the people who left too. Your story, reclaimed.
          </p>
          <p className="mt-6 text-sm uppercase tracking-[0.24em] text-monetura-champagne">
            Built around five pillars: Mind, Body, Kindness, Growth and Love.
          </p>
        </div>
      </section>

      <section id="join" className="scroll-mt-24 py-20 sm:py-28">
        <div className="mx-auto max-w-lg px-6">
          {mailingAddress ? (
            <WaitlistForm
              consentText={WAITLIST_CONSENT_TEXT}
              senderLine={`Emails come from ${waitlistSenderLine(mailingAddress)}`}
            />
          ) : (
            // CASL: no form and no consent box until the sender can be identified.
            <p className="text-center text-base leading-8 text-monetura-cream/80">
              The waitlist opens shortly. Email{" "}
              <a href="mailto:founders@monetura.com" className="text-monetura-champagne underline">
                founders@monetura.com
              </a>{" "}
              and we&rsquo;ll let you know.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
