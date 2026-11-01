import Link from "next/link";

export default function ApplySuccessPage() {
  return (
    <main className="bg-monetura-charcoal min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center py-24">

        {/* Gold checkmark */}
        <div className="flex items-center justify-center mb-10">
          <div className="w-16 h-16 rounded-full border border-monetura-champagne/40 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 14.5L11.5 20L22 9"
                stroke="#D4A853"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Decorative line */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-10 h-px bg-monetura-champagne/30" />
          <span className="text-monetura-champagne text-[8px]">◆</span>
          <div className="w-10 h-px bg-monetura-champagne/30" />
        </div>

        <p className="editorial-label justify-center mb-6">Request Received</p>

        <h1 className="lux-heading text-3xl md:text-4xl text-monetura-cream mb-6">
          You&rsquo;re On Your Way
        </h1>

        <p className="text-monetura-cream/50 text-sm leading-relaxed mb-12">
          Your webinar request is in. Here&rsquo;s what happens next:
        </p>

        {/* Next steps */}
        <ol className="space-y-6 text-left mb-14">
          {[
            {
              step: "1",
              heading: "Check your inbox",
              body: "A confirmation will arrive shortly. Check your spam folder if you don't see it within a few minutes.",
            },
            {
              step: "2",
              heading: "We'll reach out personally",
              body: "A founding member will contact you directly to confirm your webinar time — usually within one business day.",
            },
            {
              step: "3",
              heading: "Your private webinar call",
              body: "We'll walk you through the platform, the community, and answer every question you have. No pressure. Just clarity.",
            },
          ].map(({ step, heading, body }) => (
            <li key={step} className="flex gap-5">
              <span className="flex-shrink-0 w-7 h-7 border border-monetura-champagne/40 flex items-center justify-center text-monetura-champagne text-[10px] font-garet font-bold">
                {step}
              </span>
              <div>
                <p className="text-monetura-cream text-sm font-garet font-bold mb-1">
                  {heading}
                </p>
                <p className="text-monetura-cream/45 text-xs leading-relaxed">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="hairline mb-10" />

        <Link href="/" className="btn-primary inline-flex">
          Back to Monetura
        </Link>

        <p className="text-monetura-cream/30 text-xs mt-8">
          Questions?{" "}
          <a
            href="mailto:founders@monetura.com"
            className="text-monetura-champagne/70 underline underline-offset-4 hover:text-monetura-champagne transition-colors"
          >
            founders@monetura.com
          </a>
        </p>
      </div>
    </main>
  );
}
