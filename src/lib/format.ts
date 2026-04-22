import { format } from "d3-format";

const mwFmt = format(",.0f");
const mwDecFmt = format(",.1f");
const pctFmt = format(".0f");
const compactFmt = format(".2s");

export function formatMW(mw: number | undefined, decimal = false): string {
  if (mw === undefined || Number.isNaN(mw)) return "—";
  return (decimal ? mwDecFmt(mw) : mwFmt(mw)) + " MW";
}

export function formatPct(pct: number | undefined): string {
  if (pct === undefined || Number.isNaN(pct)) return "—";
  return pctFmt(pct) + "%";
}

export function formatCompactMW(mw: number): string {
  return compactFmt(mw).replace("G", "B") + "W";
}

export function formatCount(n: number): string {
  return format(",.0f")(n);
}

export function formatTicker(t: string): string {
  return t.toUpperCase();
}
