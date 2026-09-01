"use client";

import { useState } from "react";
import Link from "next/link";

export interface SubmissionItem {
  id: number;
  productName: string;
  brand: string;
  category: string;
  publicPrice: string | null;
  memberPrice: string | null;
  description: string;
  productUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
  createdAt: string;
  memberName: string;
  memberEmail: string;
}

const C = {
  bg: "#130D0A",
  card: "#1A0F0A",
  mocha: "#4A3728",
  gold: "#D4A853",
  cream: "#FBF5ED",
  sand: "#E8DCCB",
  mid: "#8B6E52",
};

export function SubmissionsClient({
  submissions,
}: {
  submissions: SubmissionItem[];
}) {
  const [items, setItems] = useState(submissions);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(id: number, action: "approve" | "reject") {
    if (busyId !== null) return;
    setBusyId(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/marketplace/submissions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        setItems((prev) => prev.filter((s) => s.id !== id));
      } else {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Action failed — please try again.");
      }
    } catch {
      setError("Action failed — please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/founders"
            className="inline-flex items-center gap-2 text-sm mb-6"
            style={{ color: C.mid, textDecoration: "none" }}
          >
            ← Admin · Founders
          </Link>
          <p
            className="text-xs font-bold tracking-widest uppercase mb-2"
            style={{ color: C.mid }}
          >
            Admin · Marketplace
          </p>
          <h1
            className="text-4xl font-semibold"
            style={{ color: C.cream, fontFamily: "var(--font-heading)" }}
          >
            Product Submissions
          </h1>
          <p className="mt-2 text-base" style={{ color: "#C4A882" }}>
            {items.length} pending review. Approving creates an{" "}
            <em>unpublished</em> product for final polish before it goes live.
          </p>
        </div>

        {error && (
          <div
            className="mb-6 px-4 py-3 rounded-xl text-sm"
            style={{
              background: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.2)",
              color: "#FCA5A5",
            }}
          >
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: "#2C2420", border: `1px solid ${C.mocha}` }}
          >
            <p
              className="text-2xl font-light mb-2"
              style={{ color: C.cream, fontFamily: "var(--font-heading)" }}
            >
              All caught up
            </p>
            <p className="text-sm" style={{ color: "#C4A882" }}>
              No pending submissions. New ones appear here as members submit
              products.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl p-5"
                style={{ background: "#2C2420", border: `1px solid ${C.mocha}` }}
              >
                <div className="flex flex-col sm:flex-row gap-5">
                  {/* Image */}
                  <div
                    className="w-full sm:w-36 h-36 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: C.card, border: `1px solid ${C.mocha}` }}
                  >
                    {s.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={s.imageUrl}
                        alt={s.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs" style={{ color: C.mid }}>
                        No image
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1"
                      style={{ color: C.mid }}
                    >
                      {s.brand} · {s.category}
                    </p>
                    <h2
                      className="text-xl font-semibold mb-1"
                      style={{ color: C.cream, fontFamily: "var(--font-heading)" }}
                    >
                      {s.productName}
                    </h2>
                    <p className="text-sm mb-2" style={{ color: C.sand }}>
                      {s.description}
                    </p>
                    {s.notes && (
                      <p className="text-xs italic mb-2" style={{ color: C.mid }}>
                        Notes: {s.notes}
                      </p>
                    )}
                    <div
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
                      style={{ color: "#C4A882" }}
                    >
                      {s.publicPrice && (
                        <span>
                          Retail <strong style={{ color: C.gold }}>${s.publicPrice}</strong>
                        </span>
                      )}
                      {s.memberPrice && (
                        <span>
                          Member <strong style={{ color: C.gold }}>${s.memberPrice}</strong>
                        </span>
                      )}
                      {s.productUrl && (
                        <a
                          href={s.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: C.gold }}
                        >
                          Product link ↗
                        </a>
                      )}
                    </div>
                    <p className="text-xs mt-2" style={{ color: C.mid }}>
                      Submitted by {s.memberName}
                      {s.memberEmail ? ` (${s.memberEmail})` : ""} ·{" "}
                      {new Date(s.createdAt).toLocaleDateString("en-CA")}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => review(s.id, "approve")}
                    disabled={busyId !== null}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold tracking-[0.08em] uppercase transition-all"
                    style={{
                      background: "linear-gradient(135deg, #C17A4A 0%, #D4A853 100%)",
                      color: "#2C2420",
                      fontFamily: "var(--font-heading)",
                      opacity: busyId === s.id ? 0.6 : 1,
                      border: "none",
                      cursor: busyId !== null ? "default" : "pointer",
                    }}
                  >
                    {busyId === s.id ? "Working…" : "Approve"}
                  </button>
                  <button
                    onClick={() => review(s.id, "reject")}
                    disabled={busyId !== null}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold tracking-[0.08em] uppercase transition-all"
                    style={{
                      background: "transparent",
                      border: `1px solid ${C.mocha}`,
                      color: C.sand,
                      fontFamily: "var(--font-heading)",
                      cursor: busyId !== null ? "default" : "pointer",
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
