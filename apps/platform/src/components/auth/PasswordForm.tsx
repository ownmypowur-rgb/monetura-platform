"use client";

import { useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface PasswordFormProps {
  mode: "set" | "reset";
}

type Phase = "form" | "success" | "expired";

export function PasswordForm({ mode }: PasswordFormProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>(token ? "form" : "expired");
  const [error, setError] = useState<string | null>(null);

  const headline =
    mode === "set" ? "Choose your password" : "Choose a new password";
  const subtitle =
    mode === "set"
      ? "Set the password for your Monetura member account"
      : "Enter a new password for your Monetura account";

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit =
    password.length >= 8 && confirm === password && !loading && !!token;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (res.ok) {
        setPhase("success");
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (res.status === 400) {
        setPhase("expired");
      } else {
        setError(data?.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 py-12"
      style={{ background: "#2C2420" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
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

        {phase === "success" && (
          <div className="text-center">
            <h2
              className="text-3xl sm:text-4xl font-light mb-3"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              You&apos;re all set
            </h2>
            <p className="text-sm mb-10" style={{ color: "#8B6E52" }}>
              Your password has been saved. Sign in to your member dashboard.
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-4 rounded-lg text-sm font-semibold tracking-wider uppercase transition-all text-center"
              style={{
                background: "#D4A853",
                color: "#2C2420",
                fontFamily: "var(--font-heading)",
                letterSpacing: "0.12em",
              }}
            >
              Sign In
            </Link>
          </div>
        )}

        {phase === "expired" && (
          <div className="text-center">
            <h2
              className="text-3xl sm:text-4xl font-light mb-3"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              This link has expired
            </h2>
            <p className="text-sm mb-10" style={{ color: "#8B6E52" }}>
              This link has expired or already been used. Request a fresh one
              and we&apos;ll email it to you right away.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block w-full py-4 rounded-lg text-sm font-semibold tracking-wider uppercase transition-all text-center"
              style={{
                background: "#D4A853",
                color: "#2C2420",
                fontFamily: "var(--font-heading)",
                letterSpacing: "0.12em",
              }}
            >
              Request a New Link
            </Link>
          </div>
        )}

        {phase === "form" && (
          <>
            <h2
              className="text-3xl sm:text-4xl font-light mb-2"
              style={{ color: "#FBF5ED", fontFamily: "var(--font-heading)" }}
            >
              {headline}
            </h2>
            <p className="text-sm mb-10" style={{ color: "#8B6E52" }}>
              {subtitle}
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs tracking-wider uppercase mb-2"
                  style={{ color: "#8B6E52" }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3.5 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
                  style={{
                    background: "#1A1410",
                    color: "#FBF5ED",
                    border: `1px solid ${tooShort ? "#B45454" : "#4A3728"}`,
                    fontFamily: "var(--font-heading)",
                  }}
                  placeholder="At least 8 characters"
                />
                {tooShort && (
                  <p className="mt-2 text-xs" style={{ color: "#FCA5A5" }}>
                    Password must be at least 8 characters.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirm"
                  className="block text-xs tracking-wider uppercase mb-2"
                  style={{ color: "#8B6E52" }}
                >
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3.5 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
                  style={{
                    background: "#1A1410",
                    color: "#FBF5ED",
                    border: `1px solid ${mismatch ? "#B45454" : "#4A3728"}`,
                    fontFamily: "var(--font-heading)",
                  }}
                  placeholder="Repeat your password"
                />
                {mismatch && (
                  <p className="mt-2 text-xs" style={{ color: "#FCA5A5" }}>
                    Passwords don&apos;t match.
                  </p>
                )}
              </div>

              {error && (
                <div
                  className="px-4 py-3 rounded-lg text-sm"
                  style={{
                    background: "rgba(220, 38, 38, 0.08)",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    color: "#FCA5A5",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-4 rounded-lg text-sm font-semibold tracking-wider uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: loading ? "#B8923D" : "#D4A853",
                  color: "#2C2420",
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "0.12em",
                }}
              >
                {loading ? "Saving..." : "Save Password"}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-xs transition-colors"
                  style={{ color: "#8B6E52" }}
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
