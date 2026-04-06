"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ApplicationForm() {
  const searchParams = useSearchParams();
  const defaultTier = searchParams.get("tier") ?? "trailblazer";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    province: "",
    businessName: "",
    businessType: "",
    annualRevenue: "",
    yearsInBusiness: "",
    tier: defaultTier,
    whyMonetura: "",
    howDidYouHear: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // TODO: Wire to /api/founders/apply route and n8n webhook WF-01
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-monetura-charcoal flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="w-12 h-px bg-monetura-champagne/30" />
            <span className="text-monetura-champagne text-xs">◆</span>
            <div className="w-12 h-px bg-monetura-champagne/30" />
          </div>
          <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-6">
            Application Received
          </p>
          <h2 className="font-garet font-bold text-3xl text-monetura-cream mb-6">
            We&rsquo;ll be in touch.
          </h2>
          <p className="text-monetura-cream/50 text-base leading-relaxed">
            Your application has been received. We review every submission
            personally and will reach out within 5 business days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-monetura-charcoal min-h-screen">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-40 pb-24">
        {/* Header */}
        <p className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-8">
          Founder Application
        </p>
        <h1 className="font-garet font-bold text-3xl md:text-5xl text-monetura-cream leading-[1.15] mb-6">
          Tell us about yourself.
        </h1>
        <p className="text-monetura-cream/50 text-base leading-relaxed mb-16">
          This isn&rsquo;t a form for everyone. Take your time. We read every
          word.
        </p>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Personal */}
          <fieldset>
            <legend className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-8">
              Personal Information
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Field
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              <Field
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <Field
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
              />
              <Field
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
              <SelectField
                label="Province"
                name="province"
                value={formData.province}
                onChange={handleChange}
                required
                options={[
                  { value: "", label: "Select province" },
                  { value: "AB", label: "Alberta" },
                  { value: "BC", label: "British Columbia" },
                  { value: "MB", label: "Manitoba" },
                  { value: "NB", label: "New Brunswick" },
                  { value: "NL", label: "Newfoundland and Labrador" },
                  { value: "NS", label: "Nova Scotia" },
                  { value: "ON", label: "Ontario" },
                  { value: "PE", label: "Prince Edward Island" },
                  { value: "QC", label: "Quebec" },
                  { value: "SK", label: "Saskatchewan" },
                  { value: "NT", label: "Northwest Territories" },
                  { value: "NU", label: "Nunavut" },
                  { value: "YT", label: "Yukon" },
                ]}
              />
            </div>
          </fieldset>

          {/* Business */}
          <fieldset>
            <legend className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-8">
              Your Business
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field
                label="Business Name"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
              />
              <Field
                label="Industry / Business Type"
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                placeholder="e.g. SaaS, Real Estate, E-commerce"
                required
              />
              <SelectField
                label="Annual Revenue"
                name="annualRevenue"
                value={formData.annualRevenue}
                onChange={handleChange}
                required
                options={[
                  { value: "", label: "Select range" },
                  { value: "pre-revenue", label: "Pre-revenue" },
                  { value: "0-100k", label: "Under $100K" },
                  { value: "100k-500k", label: "$100K – $500K" },
                  { value: "500k-1m", label: "$500K – $1M" },
                  { value: "1m-5m", label: "$1M – $5M" },
                  { value: "5m+", label: "$5M+" },
                ]}
              />
              <SelectField
                label="Years in Business"
                name="yearsInBusiness"
                value={formData.yearsInBusiness}
                onChange={handleChange}
                required
                options={[
                  { value: "", label: "Select" },
                  { value: "<1", label: "Less than 1 year" },
                  { value: "1-3", label: "1–3 years" },
                  { value: "3-7", label: "3–7 years" },
                  { value: "7+", label: "7+ years" },
                ]}
              />
            </div>
          </fieldset>

          {/* Tier */}
          <fieldset>
            <legend className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-8">
              Founder Tier
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: "explorer", name: "Explorer", price: "$2,500 CAD" },
                { id: "trailblazer", name: "Trailblazer", price: "$3,500 CAD" },
                { id: "luminary", name: "Luminary", price: "$5,500 CAD" },
              ].map(({ id, name, price }) => (
                <label
                  key={id}
                  className={`block p-6 border cursor-pointer transition-all duration-200 ${
                    formData.tier === id
                      ? "border-monetura-champagne bg-monetura-champagne/5"
                      : "border-monetura-sand/20 hover:border-monetura-sand/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="tier"
                    value={id}
                    checked={formData.tier === id}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <p className="font-garet font-bold text-base text-monetura-cream mb-1">
                    {name}
                  </p>
                  <p className="text-monetura-cream/40 text-xs">{price}</p>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Qualitative */}
          <fieldset>
            <legend className="text-monetura-champagne text-xs tracking-[0.3em] uppercase font-garet mb-8">
              The Important Part
            </legend>
            <div className="space-y-6">
              <TextareaField
                label="Why Monetura? What made you apply?"
                name="whyMonetura"
                value={formData.whyMonetura}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Be honest. We're looking for alignment, not a pitch."
              />
              <Field
                label="How did you hear about us?"
                name="howDidYouHear"
                value={formData.howDidYouHear}
                onChange={handleChange}
              />
            </div>
          </fieldset>

          {/* Submit */}
          <div className="pt-4 border-t border-monetura-sand/10">
            <button
              type="submit"
              disabled={submitting}
              className="btn-champagne w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
            <p className="text-monetura-cream/25 text-xs mt-6">
              We review every application personally. Expect a response within
              5 business days.
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

function TextareaField({
  label,
  name,
  value,
  onChange,
  required,
  rows,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-monetura-cream/50 text-xs tracking-[0.15em] uppercase mb-3">
        {label}
        {required && <span className="text-monetura-champagne ml-1">*</span>}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        rows={rows ?? 4}
        placeholder={placeholder}
        className="w-full bg-transparent border border-monetura-sand/20 text-monetura-cream text-sm px-4 py-3 focus:outline-none focus:border-monetura-champagne/60 transition-colors duration-200 placeholder:text-monetura-cream/20 resize-none"
      />
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-monetura-charcoal flex items-center justify-center">
          <p className="text-monetura-cream/40 text-sm tracking-wide">
            Loading…
          </p>
        </div>
      }
    >
      <ApplicationForm />
    </Suspense>
  );
}
