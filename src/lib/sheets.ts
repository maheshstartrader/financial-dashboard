import type { Transaction } from "@/types/finance";

const SHEET_ID = "1VNKC4jCH8G2vFycnNIopY3-XGKtCgH2TBa24CzYizKo";
const SHEET_TAB = "Form Responses 1";

console.log("[INIT] sheets.ts loaded");
console.log("[DEBUG] SHEET_ID =", SHEET_ID);
console.log("[DEBUG] SHEET_TAB =", SHEET_TAB);

/* ================================
   BASE FALLBACK RATES (SAFE)
================================ */
const FALLBACK_RATES: Record<string, number> = {
  INR: 1,
  USDT: 83,
  ETH: 250000,
  BTC: 5500000,
};

/* ================================
   LIVE RATES STATE
================================ */
let LIVE_RATES: Record<string, number> = { ...FALLBACK_RATES };

const COINGECKO_API =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=inr";

const REFRESH_INTERVAL = 60 * 1000; // 1 min (DEBUG MODE FAST)

let isInitialized = false;
let lastSuccessTime = 0;

/* ================================
   GET RATE (IMPORTANT FIX)
================================ */
function getRate(currency: string): number {
  const rate = LIVE_RATES[currency] ?? FALLBACK_RATES[currency] ?? 1;
  console.log(`[RATE] ${currency} =`, rate);
  return rate;
}

/* ================================
   FETCH LIVE RATES
================================ */
async function fetchLiveRates(): Promise<void> {
  try {
    console.log("[LIVE] Fetching crypto rates...");

    const res = await fetch(COINGECKO_API);

    console.log("[LIVE] HTTP STATUS =", res.status);

    if (!res.ok) {
      console.warn("[LIVE] API FAILED - using fallback");
      return;
    }

    const data = await res.json();

    console.log("[LIVE] RAW RESPONSE =", data);

    const newRates = {
      USDT: data?.tether?.inr ?? LIVE_RATES.USDT,
      ETH: data?.ethereum?.inr ?? LIVE_RATES.ETH,
      BTC: data?.bitcoin?.inr ?? LIVE_RATES.BTC,
    };

    LIVE_RATES = {
      ...LIVE_RATES,
      ...newRates,
    };

    lastSuccessTime = Date.now();

    console.log("[LIVE UPDATED SUCCESS]");
    console.table(LIVE_RATES);
  } catch (err) {
    console.error("[LIVE ERROR]", err);
  }
}

/* ================================
   INIT FUNCTION (MUST CALL ON APP START)
================================ */
export async function initLiveRates(): Promise<void> {
  if (isInitialized) {
    console.log("[INIT] Already initialized");
    return;
  }

  isInitialized = true;

  console.log("[INIT] Starting live rates system...");

  await fetchLiveRates();

  setInterval(() => {
    fetchLiveRates();
  }, REFRESH_INTERVAL);

  console.log("[INIT] Live rate interval set:", REFRESH_INTERVAL);
}

/* ================================
   GOOGLE SHEETS FETCH
================================ */
interface GvizCell {
  v: unknown;
  f?: string;
}
interface GvizRow {
  c: (GvizCell | null)[];
}
interface GvizResponse {
  table: {
    rows: GvizRow[];
  };
}

function parseGvizDate(v: unknown): Date | null {
  if (!v) return null;

  if (typeof v === "string") {
    const m = v.match(/Date\((\d+),(\d+),(\d+)/);
    if (m) {
      return new Date(Number(m[1]), Number(m[2]), Number(m[3]));
    }
    const dt = new Date(v);
    return isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

function cellString(cell: GvizCell | null): string {
  return cell?.v == null ? "" : String(cell.v);
}

function cellNumber(cell: GvizCell | null): number {
  if (!cell) return 0;
  if (typeof cell.v === "number") return cell.v;
  const n = parseFloat(String(cell.v).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

function weekOfYear(d: Date | null): number {
  if (!d) return 0;
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
}

/* ================================
   MAIN FETCH FUNCTION
================================ */
export async function fetchTransactions(): Promise<Transaction[]> {
  console.log("[FETCH] Starting sheet fetch...");

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
    SHEET_TAB,
  )}`;

  const res = await fetch(url);

  console.log("[FETCH] HTTP STATUS =", res.status);

  if (!res.ok) {
    throw new Error("Sheet fetch failed");
  }

  const text = await res.text();

  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?/);
  const json = JSON.parse(jsonMatch ? jsonMatch[1] : text) as GvizResponse;

  console.log("[FETCH] ROWS =", json.table.rows.length);

  return json.table.rows.map((row, i) => {
    const c = row.c;

    const amount = cellNumber(c[6]);
    const currency = cellString(c[7]) || "INR";

    const rate = getRate(currency); // 🔥 LIVE DEBUG POINT
    const inrValue = amount * rate;

    console.log(`[ROW ${i}]`, {
      amount,
      currency,
      rate,
      inrValue,
    });

    const date = parseGvizDate(c[1]?.v);

    return {
      timestamp: parseGvizDate(c[0]?.v),
      date,
      time: cellString(c[2]),
      eventType: cellString(c[3]),
      category: cellString(c[4]),
      platform: cellString(c[5]),
      amount,
      currency,
      direction: cellString(c[8]),
      purpose: cellString(c[9]),
      proof: cellString(c[10]),
      inrValue,
      week: weekOfYear(date),
    } as Transaction;
  });
}
