import { useEffect, useRef } from "react";
import type { SiteStatus, ViewMode } from "@/types";
import { useAppStore, type DisplayMode } from "@/state/useAppStore";

const DEFAULT_STATUSES: SiteStatus[] = [
  "operational",
  "under_construction",
  "planned",
  "announced",
];

const ALL_VIEW_MODES: ViewMode[] = ["company", "ai_allocation", "power_source"];
const ALL_DISPLAY_MODES: DisplayMode[] = ["globe", "matrix", "timeline"];
const ALL_STATUSES: SiteStatus[] = [
  "operational",
  "under_construction",
  "planned",
  "announced",
  "decommissioned",
];

interface UrlState {
  country?: string | null;
  site?: string | null;
  view?: ViewMode;
  display?: DisplayMode;
  tickers?: string[];
  statuses?: SiteStatus[];
}

function parseUrl(): UrlState {
  const p = new URLSearchParams(window.location.search);
  const out: UrlState = {};
  const country = p.get("country");
  if (country) out.country = country;
  const site = p.get("site");
  if (site) out.site = site;
  const view = p.get("view");
  if (view && (ALL_VIEW_MODES as string[]).includes(view)) out.view = view as ViewMode;
  const display = p.get("display");
  if (display && (ALL_DISPLAY_MODES as string[]).includes(display))
    out.display = display as DisplayMode;
  const tickers = p.get("tickers");
  if (tickers) out.tickers = tickers.split(",").filter(Boolean).map((t) => t.toUpperCase());
  const statuses = p.get("statuses");
  if (statuses) {
    const parsed = statuses
      .split(",")
      .filter((s): s is SiteStatus => (ALL_STATUSES as string[]).includes(s));
    if (parsed.length > 0) out.statuses = parsed;
  }
  return out;
}

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function writeUrl(params: Record<string, string | undefined>) {
  const p = new URLSearchParams(window.location.search);
  // Remove our managed keys, then set only the non-empty ones.
  for (const k of ["country", "site", "view", "display", "tickers", "statuses"]) p.delete(k);
  for (const [k, v] of Object.entries(params)) {
    if (v && v.length > 0) p.set(k, v);
  }
  const qs = p.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", url);
}

export function useUrlStateSync() {
  const hydrated = useRef(false);

  // Hydrate once on mount.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const s = parseUrl();
    const store = useAppStore.getState();
    if (s.country !== undefined) store.setSelectedCountry(s.country);
    if (s.site !== undefined) store.setSelectedSiteId(s.site);
    if (s.view) store.setViewMode(s.view);
    if (s.display) store.setDisplayMode(s.display);
    if (s.tickers) store.setAllTickers(s.tickers);
    if (s.statuses) {
      const current = useAppStore.getState().statusFilters;
      const next = new Set(s.statuses);
      if (!setsEqual(current, next)) {
        for (const st of current) if (!next.has(st)) store.toggleStatus(st);
        for (const st of next) if (!current.has(st)) store.toggleStatus(st);
      }
    }
  }, []);

  // Write on every relevant change.
  useEffect(() => {
    const unsub = useAppStore.subscribe((state) => {
      if (!hydrated.current) return;
      const tickers =
        state.activeTickers.size === 0
          ? undefined
          : Array.from(state.activeTickers).sort().join(",");
      const defaults = new Set(DEFAULT_STATUSES);
      const statusesChanged =
        state.statusFilters.size !== defaults.size ||
        Array.from(state.statusFilters).some((s) => !defaults.has(s));
      const statuses = statusesChanged
        ? Array.from(state.statusFilters).sort().join(",")
        : undefined;
      const view = state.viewMode === "ai_allocation" ? undefined : state.viewMode;
      const display = state.displayMode === "globe" ? undefined : state.displayMode;
      writeUrl({
        country: state.selectedCountry ?? undefined,
        site: state.selectedSiteId ?? undefined,
        view,
        display,
        tickers,
        statuses,
      });
    });
    return unsub;
  }, []);
}
