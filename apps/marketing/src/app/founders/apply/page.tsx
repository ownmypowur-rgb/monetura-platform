"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const TIERS = [
  {
    id: "Entry Founder",
    tagline: "Build your foundation",
    perks: ["Platform access", "Community network", "Founder badge"],
  },
  {
    id: "Core Founder",
    tagline: "Accelerate your growth",
    perks: ["All Entry benefits", "Travel creation tools", "Monthly strategy call"],
  },
  {
    id: "Elite Founder",
    tagline: "Scale with intention",
    perks: ["All Core benefits", "Priority deal flow", "VIP travel concierge"],
  },
  {
    id: "Platinum Founder",
    tagline: "Lead the founding circle",
    perks: ["All Elite benefits", "Founding seat on advisory", "Lifetime access guaranteed"],
  },
] as const;

const PROVINCES = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];

function WebinarForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    province: "",
    tier: "",
    referral: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.province || !formData.tier) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/founders/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }

      router.push("/founders/apply/success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-monetura-charcoal min-h-screen">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-40 pb-24">

        {/* Header */}
        <p className="editorial-label">Founder Webinar</p>
        <h1 className="lux-heading text-3xl md:text-5xl text-monetura-cream mb-6">
          Reserve Your Spot.
        </h1>
        <p className="text-monetura-cream/50 text-base leading-relaxed mb-10">
          One call. Everything you need to know. No pressure — just clarity.
        </p>

        {/* Trust pills */}
        <div className="flex flex-wrap gap-3 mb-14">
          {["Only 200 Spots", "Lifetime Locked Pricing", "Exclusive Access"].map((pill) => (
            <span
              key={pill}
              className="inline-flex items-center gap-2 border border-monetura-champagne/30 px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] text-monetura-champagne"
            >
              <span className="w-1 h-1 rounded-full bg-monetura-champagne block" />
              {pill}
            </span>
          ))}
        </div>

        {/* Tier cards */}
        <div className="mb-14">
          <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase mb-6">
            Choose Your Level
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TIERS.map(({ id, tagline, perks }) => (
              <div
                key={id}
                className="lux-panel p-6 flex flex-col gap-4"
              >
                <div>
                  <p className="font-garet font-bold text-monetura-cream text-base mb-1">
                    {id}
                  </p>
                  <p className="text-monetura-cream/40 text-xs">{tagline}</p>
                </div>
                <ul className="space-y-1.5 flex-1">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2 text-monetura-cream/60 text-xs">
                      <span className="text-monetura-champagne text-[8px]">◆</span>
                      {perk}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/founders"
                  className="btn-secondary text-[10px] py-2.5 px-4 self-start"
                >
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="hairline mb-14" />

        {/* Booking form */}
        <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase mb-8">
          Schedule Your Webinar
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Sarah Mitchell"
            />
            <Field
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@email.com"
            />
            <Field
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+1 (604) 000-0000"
            />
            <SelectField
              label="Province / Territory"
              name="province"
              value={formData.province}
              onChange={handleChange}
              required
              options={[
                { value: "", label: "Select your province" },
                ...PROVINCES,
              ]}
            />
            <SelectField
              label="Tier Interest"
              name="tier"
              value={formData.tier}
              onChange={handleChange}
              required
              options={[
                { value: "", label: "Which tier interests you?" },
                ...TIERS.map(({ id }) => ({ value: id, label: id })),
              ]}
            />
            <Field
              label="How did you hear about us?"
              name="referral"
              value={formData.referral}
              onChange={handleChange}
              placeholder="Instagram, referral, etc. (optional)"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs tracking-wide border border-red-400/30 px-4 py-3">
              {error}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Booking…" : "Schedule My Webinar"}
            </button>
            <p className="text-monetura-cream/25 text-xs mt-5 leading-relaxed">
              One of our founding members will personally walk you through
              everything — tiers, benefits, community, and what life inside
              Monetura looks like. No sales pressure. Just answers.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-monetura-cream/50 text-xs tracking-[0.15em] uppercase mb-3">
        {label}
        {required && <span className="text-monetura-champagne ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full bg-transparent border border-monetura-sand/20 text-monetura-cream text-sm px-4 py-3 focus:outline-none focus:border-monetura-champagne/60 transition-colors duration-200 placeholder:text-monetura-cream/20"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  required,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-monetura-cream/50 text-xs tracking-[0.15em] uppercase mb-3">
        {label}
        {required && <span className="text-monetura-champagne ml-1">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-monetura-charcoal border border-monetura-sand/20 text-monetura-cream text-sm px-4 py-3 focus:outline-none focus:border-monetura-champagne/60 transition-colors duration-200"
      >
        {options.map(({ value: v, label: l }) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-monetura-charcoal flex items-center justify-center">
          <p className="text-monetura-cream/40 text-sm tracking-wide">Loading…</p>
        </div>
      }
    >
      <WebinarForm />
    </Suspense>
  );
}
