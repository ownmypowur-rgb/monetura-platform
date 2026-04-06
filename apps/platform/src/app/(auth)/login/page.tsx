"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel (desktop only) ────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[60%] xl:w-[62%] flex-col">
        {/* Cinematic gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #1A0F0A 0%, #2C1810 25%, #3D2415 50%, #2C1A0E 75%, #1A0A06 100%)",
          }}
        />
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 30% 20%, #D4A85320 0%, transparent 60%), " +
              "radial-gradient(ellipse at 70% 80%, #C17A4A15 0%, transparent 50%)",
          }}
        />
        {/* Dark charcoal overlay at 70% */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(44, 36, 32, 0.70)" }}
        />

        {/* Content over overlay */}
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

          {/* Center headline */}
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
              Turn every
              <br />
              <span style={{ color: "#D4A853" }}>experience</span>
              <br />
              into income.
            </h1>
            <p
              className="text-lg font-light max-w-md leading-relaxed"
              style={{ color: "#E8DCCB", fontFamily: "var(--font-heading)" }}
            >
              Your private platform to document adventures, build your brand,
              and generate income from the life you already live.
            </p>
          </div>

          {/* Social proof stats */}
          <div className="grid grid-cols-3 gap-6 pb-2">
            {[
              { value: "200", label: "Founding Members" },
              { value: "62", label: "Countries" },
              { value: "$4,200", label: "Avg monthly earnings" },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-2xl xl:text-3xl font-semibold mb-1"
                  style={{ color: "#D4A853", fontFamily: "var(--font-heading)" }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-xs tracking-wider uppercase"
                  style={{ color: "#8B6E52" }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel / login card ──────────────────────────────── */}
      <div
        className="flex w-full lg:w-[40%] xl:w-[38%] items-center justify-center px-6 py-12 sm:px-12"
        style={{ background: "#2C2420" }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
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

          {/* Logo mark — desktop */}
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

          {/* Heading */}
          <h2
            className="text-3xl sm:text-4xl font-light mb-2"
            style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
          >
            Welcome back
          </h2>
          <p className="text-sm mb-10" style={{ color: "#8B6E52" }}>
            Sign in to your member dashboard
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
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
                  e.currentTarget.style.boxShadow =
                    "0 0 0 1px #D4A85360";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#4A3728";
                  e.currentTarget.style.boxShadow = "none";
                }}
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs tracking-wider uppercase mb-2"
                style={{ color: "#8B6E52" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3.5 pr-12 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
                  style={{
                    background: "#1A1410",
                    color: "#FBF5ED",
                    border: "1px solid #4A3728",
                    fontFamily: "var(--font-heading)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#D4A853";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 1px #D4A85360";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#4A3728";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                  style={{ color: "#8B6E52" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#D4A853";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#8B6E52";
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
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

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-4 rounded-lg text-sm font-semibold tracking-wider uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: loading ? "#B8923D" : "#D4A853",
                color: "#2C2420",
                fontFamily: "var(--font-heading)",
                letterSpacing: "0.12em",
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  e.currentTarget.style.background = "#C4973D";
              }}
              onMouseLeave={(e) => {
                if (!loading)
                  e.currentTarget.style.background = "#D4A853";
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
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>

            {/* Forgot password */}
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-xs transition-colors"
                style={{ color: "#8B6E52" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#D4A853";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#8B6E52";
                }}
              >
                Forgot your password?
              </Link>
            </div>
          </form>

          {/* Divider */}
          <div
            className="my-8 h-px"
            style={{ background: "#4A3728" }}
          />

          {/* Not a member CTA */}
          <p className="text-center text-sm" style={{ color: "#8B6E52" }}>
            Not a member?{" "}
            <a
              href="https://monetura.com/founders/apply"
              className="transition-colors font-medium"
              style={{ color: "#D4A853" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#FBF5ED";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#D4A853";
              }}
            >
              Apply for founding access →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
