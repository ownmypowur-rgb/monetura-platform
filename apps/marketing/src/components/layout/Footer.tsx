import Link from "next/link";

const links = [
  { href: "/story", label: "Our Story" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/founders", label: "Founders Club" },
  { href: "/founders/apply", label: "Apply for Access" },
];

export default function Footer() {
  return (
    <footer className="border-t border-monetura-sand/10 bg-monetura-charcoal">
      <div className="page-shell py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_0.7fr_0.8fr] lg:gap-16">
          <div>
            <p className="text-[0.95rem] uppercase tracking-[0.45em] text-monetura-champagne sm:text-[1rem]">
              Monetura
            </p>
            <p className="mt-6 max-w-md text-[1.15rem] leading-8 tracking-[0.06em] text-monetura-cream sm:text-[1.35rem] sm:leading-9">
              Passion becomes creation. Creation becomes freedom.
            </p>
            <p className="mt-5 max-w-lg text-sm leading-7 text-monetura-cream/56">
              A premium travel creator platform for founders who want their
              experiences to become content, community, and income.
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.38em] text-monetura-champagne">
              Navigate
            </p>
            <ul className="mt-6 space-y-4">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm uppercase tracking-[0.24em] text-monetura-cream/64 transition-colors duration-300 hover:text-monetura-champagne"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.38em] text-monetura-champagne">
              Contact
            </p>
            <div className="mt-6 space-y-4">
              <a
                href="mailto:founders@monetura.com"
                className="block text-sm uppercase tracking-[0.2em] text-monetura-cream/64 transition-colors duration-300 hover:text-monetura-champagne"
              >
                founders@monetura.com
              </a>
              <p className="text-sm leading-7 text-monetura-cream/46">
                Canada only. Limited to 200 founders. Applications reviewed
                personally.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 h-px w-full bg-[linear-gradient(90deg,transparent_0%,rgba(212,168,83,0.4)_50%,transparent_100%)] sm:mt-16" />

        <div className="mt-8 flex flex-col gap-3 text-[11px] uppercase tracking-[0.28em] text-monetura-cream/34 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Monetura. All rights reserved.</p>
          <p>200 founders — Canada only — lifetime access</p>
        </div>
      </div>
    </footer>
  );
}
