"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel (desktop only) ────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[60%] xl:w-[62%] flex-col">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #1A0F0A 0%, #2C1810 25%, #3D2415 50%, #2C1A0E 75%, #1A0A06 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 30% 20%, #D4A85320 0%, transparent 60%), " +
              "radial-gradient(ellipse at 70% 80%, #C17A4A15 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "rgba(44, 36, 32, 0.70)" }}
        />

        <div className="relative z-10 flex flex-col h-full px-16 py-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center"
              style={{ background: "#D4A853" }}
            >
              <span
                className="text-xs font-bold tracking-wider"
                style={{ color: "#2C2420", fontFamily: "var(--font-heading)" }}
              >
                M
              </span>
            </div>
            <span
              className="text-xl tracking-[0.25em] font-semibold"
              style={{
                color: "#D4A853",
                fontFamily: "var(--font-heading)",
                letterSpacing: "0.3em",
              }}
            >
              MONETURA
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <p
              className="text-sm tracking-[0.2em] uppercase mb-6"
              style={{ color: "#8B6E52" }}
            >
              Member Platform
            </p>
            <h1
              className="text-5xl xl:text-6xl font-light leading-tight mb-6"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              Your journey
              <br />
              <span style={{ color: "#D4A853" }}>continues</span>
              <br />
              here.
            </h1>
            <p
              className="text-lg font-light max-w-md leading-relaxed"
              style={{ color: "#E8DCCB", fontFamily: "var(--font-heading)" }}
            >
              Regain access to your private platform and pick up right where
              you left off.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────────── */}
      <div
        className="flex w-full lg:w-[40%] xl:w-[38%] items-center justify-center px-6 py-12 sm:px-12"
        style={{ background: "#2C2420" }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-10 lg:hidden">
            <div
              className="w-7 h-7 rounded-sm flex items-center justify-center"
              style={{ background: "#D4A853" }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: "#2C2420", fontFamily: "var(--font-heading)" }}
              >
                M
              </span>
            </div>
            <span
              className="text-lg tracking-[0.3em] font-semibold"
              style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
            >
              MONETURA
            </span>
          </div>

          {/* Desktop logo mark */}
          <div className="hidden lg:flex items-center gap-2 mb-10">
            <div
              className="w-7 h-7 rounded-sm flex items-center justify-center"
              style={{ background: "#D4A853" }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: "#2C2420", fontFamily: "var(--font-heading)" }}
              >
                M
              </span>
            </div>
            <span
              className="text-base tracking-[0.3em] font-semibold"
              style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
            >
              MONETURA
            </span>
          </div>

          {!submitted ? (
            <>
              <h2
                className="text-3xl sm:text-4xl font-light mb-2"
                style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
              >
                Reset your password
              </h2>
              <p className="text-sm mb-10" style={{ color: "#8B6E52" }}>
                Enter your email and we&apos;ll send you a reset link
              </p>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs tracking-wider uppercase mb-2"
                    style={{ color: "#8B6E52" }}
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3.5 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
                    style={{
                      background: "#1A1410",
                      color: "#FBF5ED",
                      border: "1px solid #4A3728",
                      fontFamily: "var(--font-heading)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#D4A853";
                      e.currentTarget.style.boxShadow = "0 0 0 1px #D4A85360";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#4A3728";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    placeholder="you@example.com"
                  />
                </div>

                {error && (
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                    style={{
                      background: "rgba(220, 38, 38, 0.08)",
                      border: "1px solid rgba(220, 38, 38, 0.2)",
                      color: "#FCA5A5",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="flex-shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-4 rounded-lg text-sm font-semibold tracking-wider uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: loading ? "#B8923D" : "#D4A853",
                    color: "#2C2420",
                    fontFamily: "var(--font-heading)",
                    letterSpacing: "0.12em",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.background = "#C4973D";
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.background = "#D4A853";
                  }}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success state */
            <div>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
                style={{ background: "rgba(212,168,83,0.1)", border: "1px solid rgba(212,168,83,0.2)" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#D4A853"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2
                className="text-3xl font-light mb-3"
                style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
              >
                Check your email
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#8B6E52" }}>
                If an account exists for that email, you&apos;ll receive a reset
                link shortly.
              </p>
            </div>
          )}

          <div className="my-8 h-px" style={{ background: "#4A3728" }} />

          <Link
            href="/login"
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: "#8B6E52" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#D4A853"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#8B6E52"; }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15,18 9,12 15,6" />
            </svg>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
