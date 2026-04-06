import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-monetura-charcoal border-t border-monetura-sand/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
          {/* Brand */}
          <div className="md:col-span-1">
            <p className="text-monetura-champagne font-garet font-bold text-xl tracking-[0.15em] uppercase mb-4">
              Monetura
            </p>
            <p className="text-monetura-cream/50 text-sm leading-relaxed max-w-xs">
              Passion becomes creation.
              <br />
              Creation becomes freedom.
              <br />
              <span className="text-monetura-cream/25 text-xs">
                Canada&rsquo;s AI-powered travel creator platform.
              </span>
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="section-label mb-6">Navigate</p>
            <ul className="space-y-4">
              {[
                { href: "/story", label: "Our Story" },
                { href: "/how-it-works", label: "How It Works" },
                { href: "/founders", label: "Founders" },
                { href: "/founders/apply", label: "Apply for Access" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-monetura-cream/50 hover:text-monetura-cream text-sm tracking-wide transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="section-label mb-6">Connect</p>
            <ul className="space-y-4">
              <li>
                <a
                  href="mailto:founders@monetura.com"
                  className="text-monetura-cream/50 hover:text-monetura-champagne text-sm tracking-wide transition-colors duration-200"
                >
                  founders@monetura.com
                </a>
              </li>
              <li>
                <p className="text-monetura-cream/30 text-sm">
                  Canada — By invitation only
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-monetura-sand/10 pt-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-monetura-cream/25 text-xs tracking-[0.1em] uppercase">
            &copy; {new Date().getFullYear()} Monetura. All rights reserved.
          </p>
          <p className="text-monetura-cream/25 text-xs tracking-[0.1em] uppercase">
            200 Founders &mdash; Canada Only &mdash; Lifetime Access
          </p>
        </div>
      </div>
    </footer>
  );
}
