import type { Transaction } from "@/types/finance";

const SHEET_ID = (import.meta.env.VITE_SHEET_ID as string) || "1VNKC4jCH8G2vFycnNIopY3-XGKtCgH2TBa24CzYizKo";
const SHEET_TAB = (import.meta.env.VITE_SHEET_TAB as string) || "Form Responses 1";

console.log("[DEBUG] SHEET_ID =", SHEET_ID);
console.log("[DEBUG] SHEET_TAB =", SHEET_TAB);

/** Approximate fallback conversion rates if INRValue column is blank. */
const FALLBACK_RATES: Record<string, number> = {
  INR: 1,
  USDT: 83,
  ETH: 250000,
  BTC: 5500000,
};

interface GvizCell {
  v: unknown;
  f?: string;
}
interface GvizRow {
  c: (GvizCell | null)[];
}
interface GvizResponse {
  table: {
    cols: { id: string; label: string; type: string }[];
    rows: GvizRow[];
  };
}

function parseGvizDate(v: unknown): Date | null {
  if (!v) return null;
  if (typeof v === "string") {
    // gviz dates come as "Date(yyyy,m,d[,h,mm,ss])" where m is 0-indexed
    const m = v.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
    if (m) {
      const [, y, mo, d, h, mi, s] = m;
      return new Date(
        Number(y),
        Number(mo),
        Number(d),
        Number(h ?? 0),
        Number(mi ?? 0),
        Number(s ?? 0),
      );
    }
    const dt = new Date(v);
    return isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

function cellString(cell: GvizCell | null): string {
  if (!cell) return "";
  if (cell.f) return cell.f;
  return cell.v == null ? "" : String(cell.v);
}

function cellNumber(cell: GvizCell | null): number {
  if (!cell) return 0;
  if (typeof cell.v === "number") return cell.v;
  const n = parseFloat(String(cell.v ?? "").replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

function monthLabel(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleString("en-US", { month: "short" }) + "-" + d.getFullYear();
}

function weekOfYear(d: Date | null): number {
  if (!d) return 0;
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
}

export async function fetchTransactions(): Promise<Transaction[]> {
  if (!SHEET_ID) throw new Error("VITE_SHEET_ID is not configured");
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
    SHEET_TAB,
  )}`;
  console.log("[DEBUG] URL =", url);
  const res = await fetch(url);
  console.log("[DEBUG] HTTP STATUS =", res.status);
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${res.status}`);
  const text = await res.text();
  console.log("[DEBUG] RESPONSE PREVIEW =", text.slice(0, 200));
  // gviz wraps JSON in: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?$/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;
  const data = JSON.parse(jsonStr) as GvizResponse;
  console.log("[DEBUG] ROW COUNT =", data?.table?.rows?.length);
  return data.table.rows.map((row) => {
    const c = row.c;
    const timestamp = parseGvizDate(c[0]?.v);
    const date = parseGvizDate(c[1]?.v) ?? timestamp;
    const time = cellString(c[2]);
    const eventType = cellString(c[3]);
    const category = cellString(c[4]);
    const platform = cellString(c[5]);
    const amount = cellNumber(c[6]);
    const currency = cellString(c[7]) || "INR";
    const direction = cellString(c[8]);
    const purpose = cellString(c[9]);
    const proof = cellString(c[10]);
    const monthCell = cellString(c[11]);
    const yearCell = cellNumber(c[12]);
    const weekCell = cellNumber(c[13]);
    const inrCell = cellNumber(c[14]);

    const inrValue = inrCell > 0 ? inrCell : amount * (FALLBACK_RATES[currency] ?? 1);

    return {
      timestamp,
      date,
      time,
      eventType,
      category,
      platform,
      amount,
      currency,
      direction,
      purpose,
      proof,
      inrValue,
      month: monthCell || monthLabel(date),
      year: yearCell || (date ? date.getFullYear() : 0),
      week: weekCell || weekOfYear(date),
    } as Transaction;
  });
}
