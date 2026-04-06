import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Welcome to Monetura",
  description: "You're in. Welcome to the Monetura founder community.",
};

export default function SuccessPage() {
  return (
    <main className="bg-monetura-charcoal min-h-screen flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        {/* Ornament */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <div className="w-16 h-px bg-monetura-champagne/30" />
          <span className="text-monetura-champagne">◆</span>
          <div className="w-16 h-px bg-monetura-champagne/30" />
        </div>

        <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-8">
          Welcome to Monetura
        </p>

        <h1 className="font-garet font-bold text-4xl md:text-5xl lg:text-6xl text-monetura-cream leading-[1.1] mb-8">
          You&rsquo;re in the room.
        </h1>

        <p className="text-monetura-cream/50 text-base md:text-lg leading-relaxed mb-16 max-w-lg mx-auto">
          Your founder access has been confirmed. Check your email for next
          steps, onboarding information, and your first curated introduction.
        </p>

        <div className="space-y-4 mb-20">
          <div className="flex items-center gap-4 text-left bg-monetura-mocha border border-monetura-sand/10 p-6">
            <span className="text-monetura-champagne text-sm flex-shrink-0">✦</span>
            <p className="text-monetura-cream/70 text-sm">
              Check your inbox — onboarding email sent to your registered address
            </p>
          </div>
          <div className="flex items-center gap-4 text-left bg-monetura-mocha border border-monetura-sand/10 p-6">
            <span className="text-monetura-champagne text-sm flex-shrink-0">✦</span>
            <p className="text-monetura-cream/70 text-sm">
              Platform access will be granted within 24 hours
            </p>
          </div>
          <div className="flex items-center gap-4 text-left bg-monetura-mocha border border-monetura-sand/10 p-6">
            <span className="text-monetura-champagne text-sm flex-shrink-0">✦</span>
            <p className="text-monetura-cream/70 text-sm">
              Your first founder introduction is coming within the week
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/" className="btn-champagne">
            Return Home
          </Link>
          <a
            href="mailto:founders@monetura.com"
            className="text-monetura-cream/40 hover:text-monetura-cream text-xs tracking-[0.2em] uppercase transition-colors duration-200"
          >
            Contact Us
          </a>
        </div>
      </div>
    </main>
  );
}
