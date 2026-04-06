"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "/story", label: "Our Story" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/founders", label: "Founders" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [menuOpen]);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-monetura-sand/10 bg-monetura-charcoal/86 backdrop-blur-xl"
          : "bg-gradient-to-b from-monetura-charcoal/60 to-transparent"
      }`}
    >
      <div className="page-shell flex h-20 items-center justify-between gap-6">
        <Link
          href="/"
          className="text-[0.95rem] uppercase tracking-[0.45em] text-monetura-champagne transition-opacity duration-300 hover:opacity-80 sm:text-[1rem]"
        >
          Monetura
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[11px] uppercase tracking-[0.34em] text-monetura-cream/72 transition-colors duration-300 hover:text-monetura-champagne"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/founders/apply" className="btn-primary px-6 py-3 text-[10px]">
            Apply Now
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-monetura-sand/15 bg-monetura-charcoal/25 md:hidden"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 top-0 block h-px w-5 bg-monetura-cream transition-all duration-300 ${
                menuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] block h-px w-5 bg-monetura-cream transition-all duration-300 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[14px] block h-px w-5 bg-monetura-cream transition-all duration-300 ${
                menuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      <div
        className={`overflow-hidden border-t border-monetura-sand/10 bg-monetura-charcoal/96 backdrop-blur-xl transition-all duration-500 md:hidden ${
          menuOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="page-shell flex flex-col gap-6 py-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm uppercase tracking-[0.3em] text-monetura-cream/78 transition-colors duration-300 hover:text-monetura-champagne"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/founders/apply"
            onClick={() => setMenuOpen(false)}
            className="btn-primary mt-2 w-full"
          >
            Apply for Founder Access
          </Link>
        </div>
      </div>
    </nav>
  );
}
