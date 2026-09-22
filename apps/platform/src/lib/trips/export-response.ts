import "server-only";
import { NextResponse } from "next/server";
import { buildCsv, buildPdf, buildZip, type ExportBundle } from "./export";
import { getTripS3, storeExport } from "./s3";

export type ExportFormat = "pdf" | "csv" | "zip";

export function parseFormat(value: string | null): ExportFormat | null {
  return value === "pdf" || value === "csv" || value === "zip" ? value : null;
}

function attachmentHeader(fileName: string): string {
  return `attachment; filename="${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}"`;
}

/** Builds the requested format and returns it (PDF/CSV inline, ZIP via S3). */
export async function exportResponse(
  bundle: ExportBundle,
  format: ExportFormat,
  userId: string
): Promise<Response> {
  try {
    if (format === "csv") {
      return new NextResponse(buildCsv(bundle), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": attachmentHeader(`${bundle.fileBase}-expenses.csv`),
          "Cache-Control": "private, no-store",
        },
      });
    }
    if (format === "pdf") {
      const pdf = await buildPdf(bundle);
      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": attachmentHeader(`${bundle.fileBase}.pdf`),
          "Cache-Control": "private, no-store",
        },
      });
    }

    const s3 = getTripS3();
    if (!s3) return NextResponse.json({ error: "Storage service not configured" }, { status: 500 });
    const zip = await buildZip(bundle, s3);
    const url = await storeExport(s3, userId, `${bundle.fileBase}.zip`, zip, "application/zip");
    const res = NextResponse.redirect(url, 302);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (err) {
    console.error(`[trips/export] ${format} export failed:`, err);
    return NextResponse.json({ error: "The export could not be built. Please try again." }, { status: 500 });
  }
}
