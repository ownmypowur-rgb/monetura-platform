"use client";

import { useState } from "react";

type State = "idle" | "working" | "done" | "invalid" | "error";

// Unsubscribing happens only on the button press, never on page load:
// mail scanners open links, and a GET must not change anything.
export default function UnsubscribeButton({ token }: { token: string }) {
  const [state, setState] = useState<State>(token ? "idle" : "invalid");

  const unsubscribe = async () => {
    setState("working");
    try {
      const res = await fetch(`/api/waitlist/unsubscribe?token=${encodeURIComponent(token)}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { ok?: boolean };
      setState(data.ok ? "done" : "invalid");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <p role="status" className="lux-heading text-2xl md:text-3xl text-monetura-cream">
        You&rsquo;re unsubscribed. You won&rsquo;t hear from us again unless you join the waitlist again.
      </p>
    );
  }
  if (state === "invalid") {
    return (
      <p role="status" className="text-monetura-cream/70 text-base leading-relaxed">
        This link isn&rsquo;t valid. Email{" "}
        <a href="mailto:founders@monetura.com" className="text-monetura-champagne underline">
          founders@monetura.com
        </a>{" "}
        and we&rsquo;ll remove you by hand.
      </p>
    );
  }

  return (
    <>
      <h1 className="lux-heading text-3xl md:text-4xl text-monetura-cream mb-10">
        Unsubscribe from Monetura emails?
      </h1>
      <button type="button" onClick={unsubscribe} disabled={state === "working"} className="btn-primary">
        Unsubscribe
      </button>
      {state === "error" && (
        <p role="alert" className="mt-6 text-monetura-cream/60 text-sm">
          Something went wrong. Please try again in a moment.
        </p>
      )}
    </>
  );
}
