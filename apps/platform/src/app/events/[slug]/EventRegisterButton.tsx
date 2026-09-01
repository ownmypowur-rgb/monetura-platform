"use client";

import { useState } from "react";

interface EventRegisterButtonProps {
  eventId: number;
  ctaLabel: string;
  initiallyRegistered: boolean;
}

export function EventRegisterButton({
  eventId,
  ctaLabel,
  initiallyRegistered,
}: EventRegisterButtonProps) {
  const [registered, setRegistered] = useState(initiallyRegistered);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (loading || registered) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      if (res.ok) {
        setRegistered(true);
      } else {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Something went wrong — please try again.");
      }
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <div
        className="w-full py-5 rounded-xl text-base font-semibold tracking-[0.1em] uppercase text-center"
        style={{
          background: "rgba(212,168,83,0.1)",
          border: "1px solid rgba(212,168,83,0.4)",
          color: "#D4A853",
          fontFamily: "var(--font-heading)",
        }}
      >
        You&apos;re on the list ✦
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full py-5 rounded-xl text-base font-semibold tracking-[0.1em] uppercase transition-all active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, #C17A4A 0%, #D4A853 100%)",
          color: "#2C2420",
          boxShadow: "0 4px 24px rgba(193,122,74,0.3)",
          fontFamily: "var(--font-heading)",
          opacity: loading ? 0.6 : 1,
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "Saving…" : ctaLabel}
      </button>
      {error && (
        <p className="text-sm mt-3" style={{ color: "#FCA5A5" }}>
          {error}
        </p>
      )}
    </>
  );
}
