"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ATTACHMENT_LABELS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  COMMON_CURRENCIES,
  EVIDENCE_LABELS,
  EVIDENCE_ORDER,
  MEALS_FLAG,
  PAYMENT_METHOD_LABELS,
  PAYMENT_ORDER,
  RATE_SOURCE_LABELS,
  RECEIPT_READ_CREDIT_COST,
  VENDOR_NOTE_TIP,
  type AttachmentType,
  type EvidenceType,
  type ExpenseCategory,
  type PaymentMethod,
  type RateSource,
} from "@/lib/trips/constants";
import { formatCad, formatRate } from "@/lib/trips/money";
import { discardTripFile, prepareImage, uploadTripFile } from "@/lib/trips/upload-client";
import { SignaturePad } from "./SignaturePad";
import {
  ErrorBanner,
  Field,
  formatDay,
  inputClass,
  localToday,
  primaryButtonClass,
  secondaryButtonClass,
} from "./ui";

// ── Types ────────────────────────────────────────────────────────────────────

export interface FormAttachment {
  id: number;
  type: AttachmentType;
  /** True once linked to a saved expense — it can no longer be removed alone. */
  saved: boolean;
  /** Local object URL for a just-taken photo; otherwise served via the private route. */
  localUrl?: string;
}

export interface ExpenseFormInitial {
  expenseDate: string;
  vendorName: string;
  description: string;
  category: ExpenseCategory;
  amount: string;
  currency: string;
  paymentMethod: PaymentMethod;
  evidenceType: EvidenceType;
  vendorSignerName: string;
  businessPurpose: string;
  businessUsePercent: number;
  aiAssisted: boolean;
}

export interface StoredConversion {
  exchangeRate: string;
  rateSource: RateSource;
  rateDate: string | null;
  cadAmount: string;
}

interface Props {
  tripId: number;
  tripStart: string;
  tripEnd: string;
  defaultPercent: number;
  expenseId?: number;
  initial?: ExpenseFormInitial;
  stored?: StoredConversion;
  initialAttachments: FormAttachment[];
  /** Opened from "No receipt": start on the cash / no-receipt path. */
  startWithoutReceipt?: boolean;
}

type AiField = "vendorName" | "expenseDate" | "amount" | "currency" | "description";
type FxMode = "boc" | "member_rate" | "card_statement" | "keep";

type FxPreview =
  | { status: "idle" | "loading" | "cad" | "not_published" | "unavailable" }
  | { status: "found"; rate: string; rateDate: string };

const AI_FIELD_LABELS: Record<AiField, string> = {
  vendorName: "vendor",
  expenseDate: "date",
  amount: "amount",
  currency: "currency",
  description: "description",
};

function attachmentSrc(a: FormAttachment): string {
  return a.localUrl ?? `/api/trips/attachments/${a.id}`;
}

function approxCad(amount: string, rate: string): string | null {
  const a = Number(amount);
  const r = Number(rate);
  if (!Number.isFinite(a) || !Number.isFinite(r) || a <= 0 || r <= 0) return null;
  return (Math.round(a * r * 100) / 100).toFixed(2);
}

// ── Component ────────────────────────────────────────────────────────────────

export function ExpenseForm({
  tripId,
  tripStart,
  tripEnd,
  defaultPercent,
  expenseId,
  initial,
  stored,
  initialAttachments,
  startWithoutReceipt,
}: Props) {
  const router = useRouter();
  const isEdit = expenseId !== undefined;

  const defaultDate = useMemo(() => {
    const today = localToday();
    return today > tripEnd ? tripEnd : today;
  }, [tripEnd]);

  const [expenseDate, setExpenseDate] = useState(initial?.expenseDate ?? defaultDate);
  const [vendorName, setVendorName] = useState(initial?.vendorName ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<ExpenseCategory | "">(initial?.category ?? "");
  const [amount, setAmount] = useState(initial?.amount ? String(Number(initial.amount)) : "");
  const [currency, setCurrency] = useState(
    !initial ? "CAD" : COMMON_CURRENCIES.includes(initial.currency) ? initial.currency : "OTHER"
  );
  const [otherCurrency, setOtherCurrency] = useState(
    initial && !COMMON_CURRENCIES.includes(initial.currency) ? initial.currency : ""
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initial?.paymentMethod ?? (startWithoutReceipt ? "cash" : "card")
  );
  const [evidenceType, setEvidenceType] = useState<EvidenceType>(
    initial?.evidenceType ?? (startWithoutReceipt ? "self_declared" : "official_receipt")
  );
  const [vendorSignerName, setVendorSignerName] = useState(initial?.vendorSignerName ?? "");
  const [businessPurpose, setBusinessPurpose] = useState(initial?.businessPurpose ?? "");
  const [businessUsePercent, setBusinessUsePercent] = useState(
    String(initial?.businessUsePercent ?? defaultPercent)
  );

  const [fxMode, setFxMode] = useState<FxMode>(isEdit ? "keep" : "boc");
  const [memberRate, setMemberRate] = useState("");
  const [cardCad, setCardCad] = useState("");
  const [fxPreview, setFxPreview] = useState<FxPreview>({ status: "idle" });

  const [attachments, setAttachments] = useState<FormAttachment[]>(initialAttachments);
  const [uploading, setUploading] = useState<AttachmentType | null>(null);
  const [aiPending, setAiPending] = useState<Set<AiField>>(new Set());
  const [aiUsed, setAiUsed] = useState(initial?.aiAssisted ?? false);
  const [aiBusy, setAiBusy] = useState<number | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const receiptInput = useRef<HTMLInputElement | null>(null);
  const libraryInput = useRef<HTMLInputElement | null>(null);
  const noteInput = useRef<HTMLInputElement | null>(null);

  const effectiveCurrency = currency === "OTHER" ? otherCurrency.trim().toUpperCase() : currency;
  const noReceipt = evidenceType !== "official_receipt";
  const hasSignature = attachments.some((a) => a.type === "signature");

  // Conversion inputs changed on an edit → the stored rate no longer applies.
  const conversionChanged =
    isEdit &&
    initial !== undefined &&
    (effectiveCurrency !== initial.currency ||
      expenseDate !== initial.expenseDate ||
      Number(amount) !== Number(initial.amount));
  useEffect(() => {
    if (fxMode === "keep" && conversionChanged) setFxMode("boc");
  }, [conversionChanged, fxMode]);

  // Bank of Canada preview (the server looks it up again on save).
  useEffect(() => {
    if (!/^[A-Z]{3}$/.test(effectiveCurrency) || !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
      setFxPreview({ status: "idle" });
      return;
    }
    if (effectiveCurrency === "CAD") {
      setFxPreview({ status: "cad" });
      return;
    }
    let cancelled = false;
    setFxPreview({ status: "loading" });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/trips/fx?currency=${effectiveCurrency}&date=${expenseDate}`);
        const data = (await res.json()) as
          | { kind: "found"; rate: string; rateDate: string }
          | { kind: "not_published" | "unavailable" | "cad" };
        if (cancelled) return;
        if (data.kind === "found") setFxPreview({ status: "found", rate: data.rate, rateDate: data.rateDate });
        else if (data.kind === "not_published") setFxPreview({ status: "not_published" });
        else setFxPreview({ status: "unavailable" });
      } catch {
        if (!cancelled) setFxPreview({ status: "unavailable" });
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [effectiveCurrency, expenseDate]);

  // BoC doesn't publish this currency → steer to member-supplied values.
  useEffect(() => {
    if (fxPreview.status === "not_published" && fxMode === "boc") {
      setFxMode(paymentMethod === "card" ? "card_statement" : "member_rate");
    }
  }, [fxPreview.status, fxMode, paymentMethod]);

  // ── AI field confirmation ────────────────────────────────────────────────
  function touched(field: AiField) {
    setAiPending((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }

  function aiConfirm(field: AiField) {
    if (!aiPending.has(field)) return null;
    return (
      <button type="button" onClick={() => touched(field)}
        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#E8C88A] px-3 py-1.5 text-sm text-[#E8C88A]">
        AI read this — tap to confirm it&apos;s right ✓
      </button>
    );
  }

  const aiBorder = (field: AiField) => (aiPending.has(field) ? " !border-[#E8C88A]" : "");

  // ── Uploads ──────────────────────────────────────────────────────────────
  async function addPhoto(file: File | undefined, type: AttachmentType) {
    if (!file) return;
    setError(null);
    setUploading(type);
    try {
      const { blob, name } = await prepareImage(file);
      const id = await uploadTripFile(tripId, type, blob, name);
      setAttachments((prev) => [...prev, { id, type, saved: false, localUrl: URL.createObjectURL(blob) }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function saveSignature(png: Blob) {
    setError(null);
    try {
      // A re-sign replaces the previous unsaved signature.
      const previous = attachments.filter((a) => a.type === "signature" && !a.saved);
      await Promise.all(previous.map((a) => discardTripFile(a.id)));
      const id = await uploadTripFile(tripId, "signature", png, `signature-${Date.now()}.png`);
      setAttachments((prev) => [
        ...prev.filter((a) => !(a.type === "signature" && !a.saved)),
        { id, type: "signature", saved: false, localUrl: URL.createObjectURL(png) },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the signature");
    }
  }

  async function removeAttachment(a: FormAttachment) {
    if (a.saved) return;
    await discardTripFile(a.id);
    setAttachments((prev) => prev.filter((x) => x.id !== a.id));
  }

  // ── AI receipt reading ───────────────────────────────────────────────────
  async function readWithAi(attachmentId: number) {
    setError(null);
    setAiNotice(null);
    setAiBusy(attachmentId);
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses/read-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentId }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        creditsRemaining?: number;
        fields?: {
          vendorName: string | null;
          expenseDate: string | null;
          amount: string | null;
          currency: string | null;
          description: string | null;
        };
      } | null;
      if (!res.ok || !data?.fields) {
        setError(data?.error ?? "Couldn't read this receipt — please enter the details yourself.");
        return;
      }
      const f = data.fields;
      const filled = new Set<AiField>();
      if (f.vendorName) { setVendorName(f.vendorName); filled.add("vendorName"); }
      if (f.expenseDate) { setExpenseDate(f.expenseDate); filled.add("expenseDate"); }
      if (f.amount) { setAmount(f.amount); filled.add("amount"); }
      if (f.currency) {
        if (COMMON_CURRENCIES.includes(f.currency)) { setCurrency(f.currency); }
        else { setCurrency("OTHER"); setOtherCurrency(f.currency); }
        filled.add("currency");
      }
      if (f.description) { setDescription(f.description); filled.add("description"); }
      setAiPending(filled);
      if (filled.size > 0) setAiUsed(true);
      const missing = (Object.keys(AI_FIELD_LABELS) as AiField[]).filter((k) => !filled.has(k)).map((k) => AI_FIELD_LABELS[k]);
      setAiNotice(
        filled.size === 0
          ? "AI couldn't make out any details on this photo. Please enter them yourself."
          : `AI filled ${filled.size} field${filled.size === 1 ? "" : "s"}. Check each one and tap to confirm.${missing.length ? ` Not found: ${missing.join(", ")}.` : ""}${typeof data.creditsRemaining === "number" ? ` ${data.creditsRemaining} credits left this month.` : ""}`
      );
    } catch {
      setError("Couldn't reach the AI reader — check your connection, or enter the details yourself.");
    } finally {
      setAiBusy(null);
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (aiPending.size > 0) {
      setError("Confirm or correct every AI-filled field before saving.");
      return;
    }
    if (!category) {
      setError("Choose a category.");
      return;
    }
    if (!/^[A-Z]{3}$/.test(effectiveCurrency)) {
      setError("Enter a 3-letter currency code.");
      return;
    }
    if (evidenceType === "vendor_signature" && !hasSignature) {
      setError("Have the vendor sign on screen, then tap “Save signature”.");
      return;
    }
    if (evidenceType === "vendor_note" && !attachments.some((a) => a.type === "vendor_note_photo")) {
      setError("Add a photo of the vendor's handwritten note.");
      return;
    }
    const fx =
      effectiveCurrency === "CAD"
        ? { mode: "boc" as const }
        : fxMode === "member_rate"
          ? { mode: "member_rate" as const, rate: memberRate.trim() }
          : fxMode === "card_statement"
            ? { mode: "card_statement" as const, cadAmount: cardCad.trim() }
            : { mode: fxMode };

    setSaving(true);
    try {
      const res = await fetch(
        isEdit ? `/api/trips/${tripId}/expenses/${expenseId}` : `/api/trips/${tripId}/expenses`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expenseDate,
            vendorName,
            description: description || null,
            category,
            amount: amount.trim(),
            currency: effectiveCurrency,
            fx,
            paymentMethod,
            evidenceType,
            vendorSignerName: evidenceType === "vendor_signature" ? vendorSignerName : vendorSignerName || null,
            businessPurpose: businessPurpose || null,
            businessUsePercent: Number(businessUsePercent),
            aiAssisted: aiUsed,
            attachmentIds: attachments.filter((a) => !a.saved).map((a) => a.id),
          }),
        }
      );
      const data = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
      if (!res.ok) {
        if (data?.code === "RATE_REQUIRED") setFxMode(paymentMethod === "card" ? "card_statement" : "member_rate");
        setError(data?.error ?? "Could not save the expense.");
        return;
      }
      router.push(`/trips/${tripId}`);
      router.refresh();
    } catch {
      setError("Could not save — check your connection and try again. Nothing was lost; tap Save again.");
    } finally {
      setSaving(false);
    }
  }

  const photoAttachments = attachments.filter((a) => a.type !== "audio");
  const outsideTrip = expenseDate && (expenseDate < tripStart || expenseDate > tripEnd);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Hidden pickers. capture="environment" opens the rear camera directly on phones. */}
      <input ref={receiptInput} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { void addPhoto(e.target.files?.[0], "receipt_photo"); e.target.value = ""; }} />
      <input ref={libraryInput} type="file" accept="image/*" className="hidden"
        onChange={(e) => { void addPhoto(e.target.files?.[0], "receipt_photo"); e.target.value = ""; }} />
      <input ref={noteInput} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { void addPhoto(e.target.files?.[0], "vendor_note_photo"); e.target.value = ""; }} />

      {/* ── Evidence ───────────────────────────────────────────────── */}
      <fieldset>
        <legend className="block text-xs font-bold tracking-[0.15em] uppercase text-[#B99B74] mb-2">Proof of purchase</legend>
        <div className="grid grid-cols-2 gap-2">
          {EVIDENCE_ORDER.map((type) => (
            <label key={type}
              className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm cursor-pointer ${evidenceType === type ? "border-monetura-champagne bg-[rgba(212,168,83,0.08)] text-monetura-cream" : "border-monetura-mocha text-monetura-sand"}`}>
              <input type="radio" name="evidenceType" value={type} checked={evidenceType === type}
                onChange={() => setEvidenceType(type)} className="accent-[#D4A853] w-4 h-4 flex-shrink-0" />
              {EVIDENCE_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      {/* ── Photos ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        {evidenceType === "official_receipt" && (
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button type="button" className={primaryButtonClass} onClick={() => receiptInput.current?.click()} disabled={uploading !== null}>
              {uploading === "receipt_photo" ? "Uploading…" : "📷 Take receipt photo"}
            </button>
            <button type="button" className={secondaryButtonClass} onClick={() => libraryInput.current?.click()} disabled={uploading !== null}>
              Library
            </button>
          </div>
        )}

        {photoAttachments.length > 0 && (
          <ul className="grid grid-cols-2 gap-3">
            {photoAttachments.map((a) => (
              <li key={a.id} className="rounded-xl border border-monetura-mocha bg-monetura-charcoal overflow-hidden">
                <a href={attachmentSrc(a)} target="_blank" rel="noreferrer" className="block bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={attachmentSrc(a)} alt={ATTACHMENT_LABELS[a.type]} className="w-full h-32 object-contain" />
                </a>
                <div className="p-2 space-y-2">
                  <p className="text-xs text-[#C4A882]">{ATTACHMENT_LABELS[a.type]}{a.saved ? " · saved" : ""}</p>
                  {(a.type === "receipt_photo" || a.type === "vendor_note_photo") && (
                    <button type="button" onClick={() => readWithAi(a.id)} disabled={aiBusy !== null}
                      className="w-full rounded-lg bg-[rgba(212,168,83,0.12)] border border-[rgba(212,168,83,0.4)] px-2 py-2 text-sm text-monetura-champagne disabled:opacity-50">
                      {aiBusy === a.id ? "Reading…" : `✦ Read with AI (${RECEIPT_READ_CREDIT_COST} credit)`}
                    </button>
                  )}
                  {!a.saved && (
                    <button type="button" onClick={() => removeAttachment(a)} className="w-full text-sm text-[#C4A882] py-1">
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {aiNotice && (
          <p role="status" className="rounded-xl border border-[#E8C88A] bg-[rgba(232,200,138,0.08)] px-4 py-3 text-sm text-[#E8C88A]">
            {aiNotice}
          </p>
        )}
      </section>

      {/* ── No-receipt path ────────────────────────────────────────── */}
      {noReceipt && (
        <section className="rounded-2xl border border-monetura-mocha bg-monetura-charcoal p-4 space-y-4">
          <p className="text-sm text-monetura-cream">💡 {VENDOR_NOTE_TIP}</p>

          <button type="button" className={`${secondaryButtonClass} w-full`} onClick={() => noteInput.current?.click()} disabled={uploading !== null}>
            {uploading === "vendor_note_photo" ? "Uploading…" : `📷 Photo of handwritten note${evidenceType === "vendor_note" ? " (required)" : ""}`}
          </button>

          <Field label="Signer's name" htmlFor="vendorSignerName" required={evidenceType === "vendor_signature"}
            hint="The person signing for the vendor.">
            <input id="vendorSignerName" className={inputClass} value={vendorSignerName} maxLength={255}
              required={evidenceType === "vendor_signature"} onChange={(e) => setVendorSignerName(e.target.value)} />
          </Field>

          <div>
            <p className="block text-xs font-bold tracking-[0.15em] uppercase text-[#B99B74] mb-2">
              Vendor signature{evidenceType === "vendor_signature" && <span className="text-monetura-champagne"> *</span>}
            </p>
            {hasSignature ? (
              <div className="space-y-2">
                <p className="text-sm text-[#9FD89F]">✓ Signature saved</p>
                <p className="text-xs text-[#C4A882]">To replace an unsaved signature, sign again below.</p>
              </div>
            ) : (
              <p className="text-sm text-[#C4A882] mb-2">Hand your phone to the vendor to sign with a finger.</p>
            )}
            <SignaturePad signerName={vendorSignerName} onSave={saveSignature} />
          </div>
        </section>
      )}

      {/* ── Details ────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <Field label="Vendor" htmlFor="vendorName" required>
          <input id="vendorName" className={inputClass + aiBorder("vendorName")} value={vendorName} maxLength={255} required
            placeholder={noReceipt ? "e.g. Mercado stall — fruit seller" : "Restaurant or business name"}
            onChange={(e) => { setVendorName(e.target.value); touched("vendorName"); }} />
          {aiConfirm("vendorName")}
        </Field>

        <Field label="Date" htmlFor="expenseDate" required
          hint={outsideTrip ? `Outside the trip dates (${formatDay(tripStart)} – ${formatDay(tripEnd)}) — fine for things booked in advance.` : undefined}>
          <input id="expenseDate" type="date" className={inputClass + aiBorder("expenseDate")} value={expenseDate} required
            onChange={(e) => { setExpenseDate(e.target.value); touched("expenseDate"); }} />
          {aiConfirm("expenseDate")}
        </Field>

        <div className="grid grid-cols-[1fr_7.5rem] gap-3">
          <Field label="Amount" htmlFor="amount" required>
            <input id="amount" type="text" inputMode="decimal" autoComplete="off" className={`${inputClass} tabular-nums${aiBorder("amount")}`}
              value={amount} required placeholder="0.00" pattern="\d+(\.\d{1,3})?"
              onChange={(e) => { setAmount(e.target.value.replace(",", ".")); touched("amount"); }} />
            {aiConfirm("amount")}
          </Field>
          <Field label="Currency" htmlFor="currency" required>
            <select id="currency" className={inputClass + aiBorder("currency")} value={currency}
              onChange={(e) => { setCurrency(e.target.value); touched("currency"); }}>
              {COMMON_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="OTHER">Other…</option>
            </select>
            {aiConfirm("currency")}
          </Field>
        </div>
        {currency === "OTHER" && (
          <Field label="Currency code" htmlFor="otherCurrency" required hint="3-letter ISO code, e.g. KWD">
            <input id="otherCurrency" className={`${inputClass} uppercase`} value={otherCurrency} maxLength={3} required
              autoCapitalize="characters" onChange={(e) => { setOtherCurrency(e.target.value.toUpperCase()); touched("currency"); }} />
          </Field>
        )}

        {/* ── Conversion to CAD ──────────────────────────────────── */}
        {effectiveCurrency !== "CAD" && /^[A-Z]{3}$/.test(effectiveCurrency) && (
          <fieldset className="rounded-2xl border border-monetura-mocha p-4 space-y-3">
            <legend className="px-1 text-xs font-bold tracking-[0.15em] uppercase text-[#B99B74]">Convert to CAD</legend>

            {fxMode === "keep" && stored && (
              <div className="space-y-2">
                <p className="text-sm text-monetura-sand">
                  Saved conversion: {formatRate(stored.exchangeRate)} ({RATE_SOURCE_LABELS[stored.rateSource]}
                  {stored.rateDate ? `, rate of ${formatDay(stored.rateDate)}` : ""}) = <span className="text-monetura-cream">{formatCad(stored.cadAmount)}</span>
                </p>
                <button type="button" className="text-sm text-monetura-champagne underline" onClick={() => setFxMode("boc")}>
                  Change conversion
                </button>
              </div>
            )}

            {fxMode !== "keep" && (
              <>
                <label className={`flex items-start gap-3 text-base ${fxPreview.status === "not_published" ? "opacity-50" : ""}`}>
                  <input type="radio" name="fxMode" className="accent-[#D4A853] w-4 h-4 mt-1" checked={fxMode === "boc"}
                    disabled={fxPreview.status === "not_published"} onChange={() => setFxMode("boc")} />
                  <span>
                    <span className="text-monetura-cream">Bank of Canada rate</span>
                    <span className="block text-sm text-[#C4A882]">
                      {fxPreview.status === "loading" && "Looking up the rate…"}
                      {fxPreview.status === "found" && (
                        <>
                          1 {effectiveCurrency} = {formatRate(fxPreview.rate)} CAD
                          {fxPreview.rateDate !== expenseDate && ` (latest published: ${formatDay(fxPreview.rateDate)})`}
                          {approxCad(amount, fxPreview.rate) && ` → ${formatCad(approxCad(amount, fxPreview.rate) ?? "0")}`}
                        </>
                      )}
                      {fxPreview.status === "not_published" && `The Bank of Canada doesn't publish ${effectiveCurrency}. Use one of the options below.`}
                      {fxPreview.status === "unavailable" && "Rate service not responding — it will be retried when you save, or use an option below."}
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 text-base">
                  <input type="radio" name="fxMode" className="accent-[#D4A853] w-4 h-4 mt-1" checked={fxMode === "card_statement"}
                    onChange={() => setFxMode("card_statement")} />
                  <span className="text-monetura-cream">CAD amount from my card statement</span>
                </label>
                {fxMode === "card_statement" && (
                  <input aria-label="CAD amount from card statement" inputMode="decimal" className={`${inputClass} tabular-nums`}
                    placeholder="CAD 0.00" value={cardCad} required onChange={(e) => setCardCad(e.target.value.replace(",", "."))} />
                )}

                <label className="flex items-start gap-3 text-base">
                  <input type="radio" name="fxMode" className="accent-[#D4A853] w-4 h-4 mt-1" checked={fxMode === "member_rate"}
                    onChange={() => setFxMode("member_rate")} />
                  <span className="text-monetura-cream">Enter the exchange rate myself</span>
                </label>
                {fxMode === "member_rate" && (
                  <div>
                    <input aria-label={`CAD per 1 ${effectiveCurrency}`} inputMode="decimal" className={`${inputClass} tabular-nums`}
                      placeholder={`CAD per 1 ${effectiveCurrency}`} value={memberRate} required
                      onChange={(e) => setMemberRate(e.target.value.replace(",", "."))} />
                    {approxCad(amount, memberRate) && (
                      <p className="mt-1.5 text-sm text-[#C4A882]">→ {formatCad(approxCad(amount, memberRate) ?? "0")}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </fieldset>
        )}

        <Field label="Category" htmlFor="category" required hint={category === "meals" ? MEALS_FLAG : undefined}>
          <select id="category" className={inputClass} value={category} required
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            <option value="" disabled>Choose…</option>
            {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </Field>

        <Field label="Paid by" htmlFor="paymentMethod" required>
          <div className="grid grid-cols-3 gap-2" id="paymentMethod">
            {PAYMENT_ORDER.map((m) => (
              <button key={m} type="button" onClick={() => setPaymentMethod(m)} aria-pressed={paymentMethod === m}
                className={`rounded-xl border py-3 text-base ${paymentMethod === m ? "border-monetura-champagne bg-[rgba(212,168,83,0.08)] text-monetura-cream" : "border-monetura-mocha text-monetura-sand"}`}>
                {PAYMENT_METHOD_LABELS[m]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Description" htmlFor="description" required={noReceipt}
          hint={noReceipt ? "What was bought — item, quantity, anything that identifies it." : undefined}>
          <textarea id="description" className={`${inputClass} min-h-[72px]${aiBorder("description")}`} value={description}
            maxLength={2000} required={noReceipt} onChange={(e) => { setDescription(e.target.value); touched("description"); }} />
          {aiConfirm("description")}
        </Field>

        <Field label="Business purpose" htmlFor="businessPurpose" required={noReceipt}
          hint="In your own words — who it was with or what it was for.">
          <textarea id="businessPurpose" className={`${inputClass} min-h-[72px]`} value={businessPurpose} maxLength={2000}
            required={noReceipt} onChange={(e) => setBusinessPurpose(e.target.value)} />
        </Field>

        <Field label="Business-use percentage" htmlFor="businessUsePercent" required hint="Defaults from the trip. Your estimate, for your accountant.">
          <div className="relative">
            <input id="businessUsePercent" type="number" inputMode="numeric" min={0} max={100} step={1} required
              className={`${inputClass} pr-10`} value={businessUsePercent} onChange={(e) => setBusinessUsePercent(e.target.value)} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C4A882]">%</span>
          </div>
        </Field>
      </section>

      <ErrorBanner message={error} />

      <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-gradient-to-t from-[#1A0F0A] via-[#1A0F0A] to-transparent flex gap-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        <button type="button" className={secondaryButtonClass} onClick={() => router.back()}>Cancel</button>
        <button type="submit" className={`${primaryButtonClass} flex-1`} disabled={saving || uploading !== null || aiBusy !== null}>
          {saving ? "Saving…" : aiPending.size > 0 ? `Confirm ${aiPending.size} AI field${aiPending.size === 1 ? "" : "s"} first` : isEdit ? "Save changes" : "Save expense"}
        </button>
      </div>
    </form>
  );
}
