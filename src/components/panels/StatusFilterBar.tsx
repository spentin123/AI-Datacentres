import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Dataset, SiteStatus } from "@/types";
import { useAppStore } from "@/state/useAppStore";
import { formatMW } from "@/lib/format";

const STATUS_CONFIG: {
  status: SiteStatus;
  label: string;
  color: string;
  mwSource: "current" | "planned";
}[] = [
  { status: "operational", label: "CURRENT", color: "var(--ok)", mwSource: "current" },
  {
    status: "under_construction",
    label: "BUILDING",
    color: "var(--amber)",
    mwSource: "planned",
  },
  { status: "planned", label: "PLANNED", color: "var(--cyan)", mwSource: "planned" },
  {
    status: "announced",
    label: "ANNOUNCED",
    color: "var(--cyan-glow)",
    mwSource: "planned",
  },
];

export function StatusFilterBar({ dataset }: { dataset: Dataset }) {
  const { statusFilters, toggleStatus, activeTickers, selectedCountry } =
    useAppStore();

  const counts = useMemo(() => {
    const scoped = dataset.sites
      .filter(
        (s) => activeTickers.size === 0 || activeTickers.has(s.companyTicker),
      )
      .filter((s) => !selectedCountry || s.location.country === selectedCountry);
    const out: Record<SiteStatus, { sites: number; mw: number }> = {
      operational: { sites: 0, mw: 0 },
      under_construction: { sites: 0, mw: 0 },
      planned: { sites: 0, mw: 0 },
      announced: { sites: 0, mw: 0 },
      decommissioned: { sites: 0, mw: 0 },
    };
    for (const s of scoped) {
      const mw =
        s.status === "operational"
          ? s.capacity.currentMW
          : (s.capacity.plannedMW ?? s.capacity.currentMW);
      out[s.status].sites += 1;
      out[s.status].mw += mw;
    }
    return out;
  }, [dataset.sites, activeTickers, selectedCountry]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="flex items-center gap-2 flex-nowrap w-max"
    >
      <span className="hud-label" style={{ color: "var(--fg-mute)" }}>
        STATE
      </span>
      {STATUS_CONFIG.map(({ status, label, color }) => {
        const active = statusFilters.has(status);
        const { sites, mw } = counts[status];
        return (
          <button
            key={status}
            onClick={() => toggleStatus(status)}
            className={`group flex items-center gap-1.5 px-2.5 py-1 border transition-all ${
              active
                ? "border-[var(--border-hard)] bg-[var(--bg-1)]/70"
                : "border-[var(--border-soft)] bg-transparent opacity-40 hover:opacity-80"
            }`}
            title={`${label} — ${sites} sites · ${formatMW(mw)}`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: color,
                boxShadow: active ? `0 0 6px ${color}` : "none",
              }}
            />
            <span
              className="hud-label"
              style={{ color: active ? color : "var(--fg-mute)" }}
            >
              {label}
            </span>
            <span
              className="text-[10px] tabular-nums"
              style={{ color: "var(--fg-dim)" }}
            >
              {formatMW(mw).replace(" MW", "")}
            </span>
          </button>
        );
      })}
    </motion.div>
  );
}
