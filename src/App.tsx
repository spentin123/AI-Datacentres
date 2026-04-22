import { useEffect } from "react";
import { motion } from "framer-motion";
import { getDataset } from "@/data/dataset";
import { GlobeScene } from "@/components/globe/GlobeScene";
import { TickerMatrix } from "@/components/matrix/TickerMatrix";
import { PipelineTimeline } from "@/components/timeline/PipelineTimeline";
import { ScanlineOverlay } from "@/components/hud/ScanlineOverlay";
import { SiteDetailPanel } from "@/components/panels/SiteDetailPanel";
import { StatsTicker } from "@/components/panels/StatsTicker";
import { CompanyFilterBar } from "@/components/panels/CompanyFilterBar";
import { ViewModeToggle } from "@/components/panels/ViewModeToggle";
import { DisplayModeToggle } from "@/components/panels/DisplayModeToggle";
import { Legend } from "@/components/panels/Legend";
import { CountryList } from "@/components/panels/CountryList";
import { StatusFilterBar } from "@/components/panels/StatusFilterBar";
import { BootSequence } from "@/components/intro/BootSequence";
import { useAppStore } from "@/state/useAppStore";
import { useUrlStateSync } from "@/lib/urlState";

export default function App() {
  const dataset = getDataset();
  const { bootComplete, displayMode, setSelectedSiteId } = useAppStore();
  useUrlStateSync();

  // Close panel if user clicks blank canvas area
  useEffect(() => {
    const onContainerClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest("[data-hud]")) return;
      if (target?.closest("canvas")) return;
      // otherwise, leave it
    };
    window.addEventListener("click", onContainerClick);
    return () => window.removeEventListener("click", onContainerClick);
  }, [setSelectedSiteId]);

  return (
    <div className="relative w-full h-full bg-bg-0 overflow-hidden">
      {/* Primary visualization: globe, matrix scatter, or pipeline timeline */}
      {displayMode === "globe" && <GlobeScene dataset={dataset} />}
      {displayMode === "matrix" && <TickerMatrix dataset={dataset} />}
      {displayMode === "timeline" && <PipelineTimeline dataset={dataset} />}

      {/* Faint grid backdrop (sub-atmosphere) */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />

      {/* Scanline overlay sits above globe */}
      <ScanlineOverlay />

      {/* HUD */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: bootComplete ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="pointer-events-none absolute inset-0 z-20"
      >
        {/* Top stats ticker — center, full width capped */}
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 w-[min(920px,calc(100%-2rem))] pointer-events-auto"
          data-hud
        >
          <StatsTicker dataset={dataset} />
        </div>

        {/* Legend — top-right, compact, sits below ticker on narrow viewports */}
        <div
          className="absolute top-4 right-4 pointer-events-auto hidden xl:block"
          data-hud
        >
          <Legend dataset={dataset} />
        </div>

        {/* Country list — left side, filter + metrics (globe mode only) */}
        {displayMode === "globe" && (
          <div
            className="absolute left-4 top-[260px] pointer-events-auto"
            data-hud
          >
            <CountryList dataset={dataset} />
          </div>
        )}

        {/* Bottom bar: view mode toggle + company filter, stacked */}
        <div
          className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 pointer-events-auto"
          data-hud
        >
          <div className="overflow-x-auto pb-1">
            <StatusFilterBar dataset={dataset} />
          </div>
          <div className="overflow-x-auto pb-1">
            <CompanyFilterBar dataset={dataset} />
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              <DisplayModeToggle />
              <ViewModeToggle />
            </div>
            <div className="hud-meta flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--ok)] animate-pulse-soft"
                style={{ boxShadow: "0 0 6px var(--ok)" }}
              />
              <span style={{ color: "var(--ok)" }}>LIVE</span>
              <span style={{ color: "var(--fg-dim)" }} className="ml-2">
                SYNC {dataset.lastUpdated.slice(0, 10)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Site detail panel (overlays HUD) */}
      <SiteDetailPanel sites={dataset.sites} companies={dataset.companies} />

      {/* Intro boot sequence */}
      <BootSequence siteCount={dataset.sites.length} />
    </div>
  );
}
