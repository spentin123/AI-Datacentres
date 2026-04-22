import { create } from "zustand";
import type { ViewMode, SiteStatus } from "@/types";

interface AppState {
  selectedSiteId: string | null;
  hoveredSiteId: string | null;
  selectedCountry: string | null;
  activeTickers: Set<string>;
  statusFilters: Set<SiteStatus>;
  viewMode: ViewMode;
  bootComplete: boolean;

  setSelectedSiteId: (id: string | null) => void;
  setHoveredSiteId: (id: string | null) => void;
  setSelectedCountry: (country: string | null) => void;
  toggleTicker: (ticker: string) => void;
  soloTicker: (ticker: string) => void;
  setAllTickers: (tickers: string[]) => void;
  resetTickers: (tickers: string[]) => void;
  toggleStatus: (status: SiteStatus) => void;
  setViewMode: (m: ViewMode) => void;
  setBootComplete: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedSiteId: null,
  hoveredSiteId: null,
  selectedCountry: null,
  activeTickers: new Set(),
  statusFilters: new Set<SiteStatus>([
    "operational",
    "under_construction",
    "planned",
    "announced",
  ]),
  viewMode: "ai_allocation",
  bootComplete: false,

  setSelectedSiteId: (id) => set({ selectedSiteId: id }),
  setHoveredSiteId: (id) => set({ hoveredSiteId: id }),
  setSelectedCountry: (country) => set({ selectedCountry: country }),

  toggleTicker: (ticker) =>
    set((s) => {
      const next = new Set(s.activeTickers);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return { activeTickers: next };
    }),

  soloTicker: (ticker) => set({ activeTickers: new Set([ticker]) }),

  setAllTickers: (tickers) => set({ activeTickers: new Set(tickers) }),

  resetTickers: (tickers) => set({ activeTickers: new Set(tickers) }),

  toggleStatus: (status) =>
    set((s) => {
      const next = new Set(s.statusFilters);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return { statusFilters: next };
    }),

  setViewMode: (m) => set({ viewMode: m }),
  setBootComplete: (v) => set({ bootComplete: v }),
}));

if (import.meta.env.DEV) {
  (window as unknown as { __store?: typeof useAppStore }).__store = useAppStore;
}
