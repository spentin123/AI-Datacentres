import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Dataset } from "@/types";
import { useAppStore } from "@/state/useAppStore";
import { HUDFrame } from "@/components/hud/HUDFrame";
import { MetricReadout } from "@/components/primitives/MetricReadout";
import {
  totalAiMW,
  totalAiPct,
  totalCurrentMW,
  totalPlannedMW,
} from "@/lib/derive";
import { formatMW, formatPct, formatCount } from "@/lib/format";

export function StatsTicker({ dataset }: { dataset: Dataset }) {
  const { activeTickers, statusFilters, selectedCountry } = useAppStore();

  const sites = useMemo(
    () =>
      dataset.sites
        .filter((s) => statusFilters.has(s.status))
        .filter((s) => activeTickers.size === 0 || activeTickers.has(s.companyTicker))
        .filter((s) => !selectedCountry || s.location.country === selectedCountry),
    [dataset.sites, activeTickers, statusFilters, selectedCountry],
  );

  const totalMW = totalCurrentMW(sites);
  const plannedMW = totalPlannedMW(sites);
  const aiMW = totalAiMW(sites);
  const aiPct = totalAiPct(sites);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <HUDFrame
        title={
          selectedCountry
            ? `POWER GRID // ${selectedCountry.toUpperCase()}`
            : "POWER GRID // AI INFRASTRUCTURE MONITOR"
        }
        meta={`SYNC ${dataset.lastUpdated.slice(0, 10)}`}
        padding="md"
        accent="cyan"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <MetricReadout
            label="Total Capacity"
            value={formatMW(totalMW).replace(" MW", "")}
            unit="MW"
            delta={plannedMW > 0 ? `+${formatMW(plannedMW)} planned` : "no planned add"}
            deltaTone={plannedMW > 0 ? "up" : "neutral"}
            accent="fg"
          />
          <MetricReadout
            label="AI / HPC Allocation"
            value={formatMW(aiMW).replace(" MW", "")}
            unit={`MW · ${formatPct(aiPct)}`}
            delta={`of ${formatMW(totalMW)} fleet`}
            accent="cyan"
          />
          <MetricReadout
            label="BTC Mining"
            value={formatMW(totalMW - aiMW).replace(" MW", "")}
            unit={`MW · ${formatPct(100 - aiPct)}`}
            delta={"legacy workload"}
            accent="amber"
          />
          <MetricReadout
            label="Sites Tracked"
            value={formatCount(sites.length)}
            delta={`${dataset.companies.length} operators`}
            accent="fg"
          />
        </div>
      </HUDFrame>
    </motion.div>
  );
}
