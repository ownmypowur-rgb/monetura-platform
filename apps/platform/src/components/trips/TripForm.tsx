"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TRIP_TYPE_LABELS,
  TRIP_TYPE_ORDER,
  type TripType,
} from "@/lib/trips/constants";
import { ErrorBanner, Field, inputClass, primaryButtonClass, secondaryButtonClass } from "./ui";

export interface TripFormValues {
  name: string;
  destinations: string;
  startDate: string;
  endDate: string;
  businessPurpose: string;
  tripType: TripType;
  businessUsePercent: string;
  notes: string;
}

const DEFAULT_PERCENT: Record<TripType, string> = { business: "100", mixed: "", personal: "0" };

export function TripForm({ tripId, initial }: { tripId?: number; initial?: TripFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<TripFormValues>(
    initial ?? {
      name: "",
      destinations: "",
      startDate: "",
      endDate: "",
      businessPurpose: "",
      tripType: "business",
      businessUsePercent: "100",
      notes: "",
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof TripFormValues>(key: K, value: TripFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  function changeType(type: TripType) {
    // Reset the percentage to the type's default so a mixed trip always gets a
    // deliberate number rather than an inherited 100.
    setValues((v) => ({ ...v, tripType: type, businessUsePercent: DEFAULT_PERCENT[type] }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (values.endDate && values.startDate && values.endDate < values.startDate) {
      setError("End date must be on or after the start date.");
      return;
    }
    const pct = values.businessUsePercent === "" ? null : Number(values.businessUsePercent);
    if (values.tripType === "mixed" && (pct === null || !Number.isInteger(pct) || pct < 1 || pct > 99)) {
      setError("Mixed trips need a business-use percentage between 1 and 99.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(tripId ? `/api/trips/${tripId}` : "/api/trips", {
        method: tripId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          destinations: values.destinations,
          startDate: values.startDate,
          endDate: values.endDate,
          businessPurpose: values.businessPurpose,
          tripType: values.tripType,
          businessUsePercent: pct,
          notes: values.notes || null,
        }),
      });
      const data = (await res.json().catch(() => null)) as { id?: number; error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "Could not save the trip.");
        return;
      }
      router.push(`/trips/${tripId ?? data?.id ?? ""}`);
      router.refresh();
    } catch {
      setError("Could not save the trip — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Trip name" htmlFor="name" required>
        <input id="name" className={inputClass} value={values.name} maxLength={255} required
          placeholder="Lisbon supplier visit" onChange={(e) => set("name", e.target.value)} />
      </Field>

      <Field label="Destination(s)" htmlFor="destinations" required hint="Separate several places with commas.">
        <input id="destinations" className={inputClass} value={values.destinations} maxLength={500} required
          placeholder="Lisbon, Porto" onChange={(e) => set("destinations", e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date" htmlFor="startDate" required>
          <input id="startDate" type="date" className={inputClass} value={values.startDate} required
            onChange={(e) => set("startDate", e.target.value)} />
        </Field>
        <Field label="End date" htmlFor="endDate" required>
          <input id="endDate" type="date" className={inputClass} value={values.endDate} required
            min={values.startDate || undefined} onChange={(e) => set("endDate", e.target.value)} />
        </Field>
      </div>

      <Field label="Business purpose" htmlFor="businessPurpose" required
        hint="In your own words: why you're making this trip.">
        <textarea id="businessPurpose" className={`${inputClass} min-h-[96px]`} value={values.businessPurpose}
          maxLength={5000} required placeholder="Meeting two ceramic suppliers and shooting product content for the autumn collection."
          onChange={(e) => set("businessPurpose", e.target.value)} />
      </Field>

      <fieldset>
        <legend className="block text-xs font-bold tracking-[0.15em] uppercase text-[#B99B74] mb-2">
          Trip type <span className="text-monetura-champagne">*</span>
        </legend>
        <div className="grid gap-2">
          {TRIP_TYPE_ORDER.map((type) => (
            <label key={type}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-base cursor-pointer ${values.tripType === type ? "border-monetura-champagne bg-[rgba(212,168,83,0.08)] text-monetura-cream" : "border-monetura-mocha text-monetura-sand"}`}>
              <input type="radio" name="tripType" value={type} checked={values.tripType === type}
                onChange={() => changeType(type)} className="accent-[#D4A853] w-4 h-4" />
              {TRIP_TYPE_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Business-use percentage" htmlFor="businessUsePercent" required={values.tripType === "mixed"}
        hint={values.tripType === "mixed"
          ? "Your own estimate of how much of this trip is for business. Your tax professional will review it."
          : "New expenses on this trip start with this percentage. You can change it per expense."}>
        <div className="relative">
          <input id="businessUsePercent" type="number" inputMode="numeric" min={0} max={100} step={1}
            className={`${inputClass} pr-10`} value={values.businessUsePercent}
            required={values.tripType === "mixed"}
            onChange={(e) => set("businessUsePercent", e.target.value)} />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C4A882]">%</span>
        </div>
      </Field>

      <Field label="Notes" htmlFor="notes">
        <textarea id="notes" className={`${inputClass} min-h-[80px]`} value={values.notes} maxLength={5000}
          onChange={(e) => set("notes", e.target.value)} />
      </Field>

      <ErrorBanner message={error} />

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <button type="button" className={secondaryButtonClass} onClick={() => router.back()}>Cancel</button>
        <button type="submit" className={`${primaryButtonClass} sm:flex-1`} disabled={saving}>
          {saving ? "Saving…" : tripId ? "Save changes" : "Create trip"}
        </button>
      </div>
    </form>
  );
}
