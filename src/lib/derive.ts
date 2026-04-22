import type { DataCenter, Company } from "@/types";

export function siteAiMW(site: DataCenter): number {
  return site.capacity.currentMW * (site.workload.aiHpcPct / 100);
}

export function siteBtcMW(site: DataCenter): number {
  return site.capacity.currentMW * (site.workload.btcMiningPct / 100);
}

export function totalCurrentMW(sites: DataCenter[]): number {
  return sites.reduce((acc, s) => acc + s.capacity.currentMW, 0);
}

export function totalPlannedMW(sites: DataCenter[]): number {
  return sites.reduce((acc, s) => acc + (s.capacity.plannedMW ?? 0), 0);
}

export function totalAiMW(sites: DataCenter[]): number {
  return sites.reduce((acc, s) => acc + siteAiMW(s), 0);
}

export function totalAiPct(sites: DataCenter[]): number {
  const total = totalCurrentMW(sites);
  if (total === 0) return 0;
  return (totalAiMW(sites) / total) * 100;
}

export function sitesByCompany(
  sites: DataCenter[],
): Record<string, DataCenter[]> {
  const out: Record<string, DataCenter[]> = {};
  for (const s of sites) {
    (out[s.companyTicker] ??= []).push(s);
  }
  return out;
}

export function sitesByCountry(
  sites: DataCenter[],
): Record<string, DataCenter[]> {
  const out: Record<string, DataCenter[]> = {};
  for (const s of sites) {
    (out[s.location.country] ??= []).push(s);
  }
  return out;
}

export function countryCentroid(sites: DataCenter[]): {
  lat: number;
  lng: number;
} {
  if (sites.length === 0) return { lat: 0, lng: 0 };
  const lat =
    sites.reduce((acc, s) => acc + s.location.lat, 0) / sites.length;
  const lng =
    sites.reduce((acc, s) => acc + s.location.lng, 0) / sites.length;
  return { lat, lng };
}

export function companyByTicker(
  companies: Company[],
): Record<string, Company> {
  return Object.fromEntries(companies.map((c) => [c.ticker, c]));
}

/** For AI-allocation color mode: 0-100% → amber → cyan gradient. */
export function aiGradientColor(aiPct: number): string {
  const t = Math.max(0, Math.min(1, aiPct / 100));
  // #f59e0b (amber) → #22d3ee (cyan)
  const from = [245, 158, 11];
  const to = [34, 211, 238];
  const r = Math.round(from[0] + (to[0] - from[0]) * t);
  const g = Math.round(from[1] + (to[1] - from[1]) * t);
  const b = Math.round(from[2] + (to[2] - from[2]) * t);
  return `rgb(${r},${g},${b})`;
}

/** Perceptually fair point radius from MW (sqrt scaling). */
export function mwToRadius(mw: number, min = 0.22, max = 1.4): number {
  const s = Math.sqrt(Math.max(0, mw));
  // Assume MW values in ~0-1000 range; sqrt in 0-32. Scale.
  const t = Math.min(1, s / 32);
  return min + (max - min) * t;
}

/** Altitude: sites with more MW sit slightly higher off the globe. */
export function mwToAltitude(mw: number, cap = 0.08): number {
  const t = Math.min(1, Math.sqrt(Math.max(0, mw)) / 32);
  return 0.005 + cap * t;
}

/**
 * A site is "stale" if the most recent source we cited is older than the
 * given threshold. Surfaced on the globe as a desaturated marker and in the
 * site panel as a STALE chip — a credibility safeguard for the finance audience.
 */
export function newestSourceDate(site: DataCenter): Date | null {
  let newest: Date | null = null;
  for (const src of site.sources ?? []) {
    const t = Date.parse(src.date);
    if (!Number.isFinite(t)) continue;
    const d = new Date(t);
    if (!newest || d > newest) newest = d;
  }
  return newest;
}

export function isSiteStale(site: DataCenter, now: Date = new Date()): boolean {
  const d = newestSourceDate(site);
  if (!d) return true;
  const twelveMonthsAgo = new Date(
    now.getFullYear() - 1,
    now.getMonth(),
    now.getDate(),
  );
  return d < twelveMonthsAgo;
}

/** Desaturate a hex/rgb color towards grey. t=0 returns original, t=1 returns grey. */
export function desaturate(color: string, t = 0.6): string {
  const m = color.match(/^#([0-9a-f]{6})$/i);
  let r: number, g: number, b: number;
  if (m) {
    const n = parseInt(m[1], 16);
    r = (n >> 16) & 255;
    g = (n >> 8) & 255;
    b = n & 255;
  } else {
    const rm = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (!rm) return color;
    r = +rm[1];
    g = +rm[2];
    b = +rm[3];
  }
  const grey = 0.299 * r + 0.587 * g + 0.114 * b;
  const mix = (v: number) => Math.round(v + (grey - v) * t);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}
