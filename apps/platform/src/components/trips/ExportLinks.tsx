"use client";

import { useState } from "react";
import { primaryButtonClass, secondaryButtonClass } from "./ui";

const FORMATS = [
  { format: "pdf", label: "PDF report", note: "Cover page, ledger by day, category totals, daily journal." },
  { format: "csv", label: "CSV spreadsheet", note: "Every expense with every field, for Excel or accounting software." },
  { format: "zip", label: "Complete package (ZIP)", note: "The PDF, the CSV, and every photo, signature and voice note — named by date, vendor and amount." },
] as const;

/**
 * Plain download links (they work in iOS Safari's download manager). The ZIP
 * can take a while for a big trip, so the tapped button says so until the
 * browser takes over.
 */
export function ExportLinks({ baseUrl, compact }: { baseUrl: string; compact?: boolean }) {
  const [preparing, setPreparing] = useState<string | null>(null);
  const join = baseUrl.includes("?") ? "&" : "?";

  function onClick(format: string) {
    setPreparing(format);
    window.setTimeout(() => setPreparing((p) => (p === format ? null : p)), format === "zip" ? 45_000 : 8_000);
  }

  return (
    <ul className={compact ? "flex flex-wrap gap-2" : "space-y-3"}>
      {FORMATS.map((f) => (
        <li key={f.format}>
          <a
            href={`${baseUrl}${join}format=${f.format}`}
            onClick={() => onClick(f.format)}
            className={`${f.format === "zip" && !compact ? primaryButtonClass : secondaryButtonClass} no-underline ${compact ? "text-sm px-4 py-2" : "w-full"}`}
          >
            {preparing === f.format ? (f.format === "zip" ? "Preparing ZIP… up to a minute" : "Preparing…") : compact ? f.format.toUpperCase() : f.label}
          </a>
          {!compact && <p className="mt-1.5 px-1 text-sm text-[#C4A882]">{f.note}</p>}
        </li>
      ))}
    </ul>
  );
}
