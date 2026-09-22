import "server-only";

// Bank of Canada Valet API — free, no key. Series FX{CUR}CAD gives the daily
// average rate as "CAD per 1 unit of CUR". Rates are published on business
// days only (~16:30 ET), so a lookup asks for a window ending on the expense
// date and takes the latest observation in it: weekends, holidays and "today
// before publication" all resolve to the most recent prior published rate,
// and the date actually used is returned so it can be stored.
//
// Verified live 2026-09-22: unknown series → HTTP 404; suspended series (RUB)
// → 200 with an empty observations array. Both mean "not published".

const VALET_BASE = "https://www.bankofcanada.ca/valet/observations";
const LOOKBACK_DAYS = 14;
const TIMEOUT_MS = 8000;

export type BocRateResult =
  | { kind: "found"; rate: string; rateDate: string }
  | { kind: "not_published" }
  | { kind: "unavailable" };

interface ValetResponse {
  observations?: Array<Record<string, unknown> & { d?: string }>;
}

// Historical rates never change, so successful lookups for past dates are
// cached per serverless instance.
const cache = new Map<string, BocRateResult>();

function shiftDate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function getBankOfCanadaRate(
  currency: string,
  isoDate: string
): Promise<BocRateResult> {
  const code = currency.toUpperCase();
  if (!/^[A-Z]{3}$/.test(code) || code === "CAD") return { kind: "not_published" };

  const cacheKey = `${code}:${isoDate}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const series = `FX${code}CAD`;
  const url = `${VALET_BASE}/${series}/json?start_date=${shiftDate(isoDate, -LOOKBACK_DAYS)}&end_date=${isoDate}`;

  let res: Response;
  try {
    res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (err) {
    console.error(`[fx] Bank of Canada request failed for ${series} ${isoDate}:`, err);
    return { kind: "unavailable" };
  }

  if (res.status === 404) {
    cache.set(cacheKey, { kind: "not_published" });
    return { kind: "not_published" };
  }
  if (!res.ok) {
    console.error(`[fx] Bank of Canada returned HTTP ${res.status} for ${series} ${isoDate}`);
    return { kind: "unavailable" };
  }

  let body: ValetResponse;
  try {
    body = (await res.json()) as ValetResponse;
  } catch {
    return { kind: "unavailable" };
  }

  const observations = (body.observations ?? []).filter(
    (o): o is Record<string, unknown> & { d: string } =>
      typeof o.d === "string" && o.d <= isoDate
  );
  // Latest observation on or before the expense date.
  observations.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  for (let i = observations.length - 1; i >= 0; i--) {
    const obs = observations[i];
    const cell = obs?.[series] as { v?: unknown } | undefined;
    if (obs && typeof cell?.v === "string" && /^\d+(\.\d+)?$/.test(cell.v)) {
      const result: BocRateResult = { kind: "found", rate: cell.v, rateDate: obs.d };
      cache.set(cacheKey, result);
      return result;
    }
  }

  // Series exists but nothing published in the window (e.g. RUB, suspended).
  return { kind: "not_published" };
}
