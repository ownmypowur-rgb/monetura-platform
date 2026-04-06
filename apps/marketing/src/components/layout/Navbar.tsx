"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-monetura-charcoal/95 backdrop-blur-sm border-b border-monetura-sand/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-monetura-champagne font-garet font-bold text-xl tracking-[0.15em] uppercase hover:opacity-80 transition-opacity"
        >
          Monetura
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          <NavLink href="/story">Our Story</NavLink>
          <NavLink href="/how-it-works">How It Works</NavLink>
          <NavLink href="/founders">Founders</NavLink>
          <Link
            href="/founders/apply"
            className="btn-champagne text-xs py-3 px-8"
          >
            Apply Now
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-6 h-px bg-monetura-cream transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2.5" : ""}`}
          />
          <span
            className={`block w-6 h-px bg-monetura-cream transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-6 h-px bg-monetura-cream transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2.5" : ""}`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        } bg-monetura-charcoal border-t border-monetura-sand/10`}
      >
        <div className="px-6 py-8 flex flex-col gap-6">
          <MobileNavLink href="/story" onClick={() => setMenuOpen(false)}>
            Our Story
          </MobileNavLink>
          <MobileNavLink
            href="/how-it-works"
            onClick={() => setMenuOpen(false)}
          >
            How It Works
          </MobileNavLink>
          <MobileNavLink href="/founders" onClick={() => setMenuOpen(false)}>
            Founders
          </MobileNavLink>
          <Link
            href="/founders/apply"
            onClick={() => setMenuOpen(false)}
            className="btn-champagne text-center"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-monetura-cream/70 hover:text-monetura-cream text-xs tracking-[0.15em] uppercase transition-colors duration-200 font-garet"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="text-monetura-cream/70 hover:text-monetura-champagne text-sm tracking-[0.15em] uppercase transition-colors duration-200"
    >
      {children}
    </Link>
  );
}
