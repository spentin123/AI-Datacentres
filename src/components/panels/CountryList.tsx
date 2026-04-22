import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X, Globe2, ChevronDown, ChevronUp } from "lucide-react";
import type { Dataset } from "@/types";
import { useAppStore } from "@/state/useAppStore";
import {
  sitesByCountry,
  totalAiMW,
  totalAiPct,
  totalCurrentMW,
} from "@/lib/derive";
import { formatMW, formatPct } from "@/lib/format";
import { CornerBrackets } from "@/components/hud/CornerBrackets";

const COUNTRY_CODE: Record<string, string> = {
  USA: "US",
  Canada: "CA",
  Norway: "NO",
  Sweden: "SE",
  Paraguay: "PY",
  Bhutan: "BT",
  UAE: "AE",
};

export function CountryList({ dataset }: { dataset: Dataset }) {
  const { selectedCountry, setSelectedCountry, statusFilters, activeTickers } =
    useAppStore();
  const [collapsed, setCollapsed] = useState(false);

  const rows = useMemo(() => {
    const filtered = dataset.sites
      .filter((s) => statusFilters.has(s.status))
      .filter(
        (s) => activeTickers.size === 0 || activeTickers.has(s.companyTicker),
      );
    const byCountry = sitesByCountry(filtered);
    return Object.entries(byCountry)
      .map(([country, sites]) => ({
        country,
        sites,
        count: sites.length,
        totalMW: totalCurrentMW(sites),
        aiMW: totalAiMW(sites),
        aiPct: totalAiPct(sites),
      }))
      .sort((a, b) => b.totalMW - a.totalMW);
  }, [dataset.sites, statusFilters, activeTickers]);

  const selectedRow = useMemo(
    () => rows.find((r) => r.country === selectedCountry) ?? null,
    [rows, selectedCountry],
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.25 }}
      className="relative glass w-[260px] flex flex-col"
    >
      <CornerBrackets size={10} color="var(--cyan)" inset={-1} />

      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-soft)]">
        <div className="flex items-center gap-1.5">
          <Globe2 size={11} style={{ color: "var(--cyan)" }} />
          <span className="hud-label">GEO FILTER // COUNTRIES</span>
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-0.5 text-[var(--fg-mute)] hover:text-[var(--cyan)]"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
      </div>

      {!collapsed && (
        <>
          {selectedRow && (
            <div className="border-b border-[var(--border-soft)] px-3 py-2.5 bg-[var(--bg-1)]/40">
              <div className="flex items-center justify-between">
                <span
                  className="hud-label"
                  style={{ color: "var(--cyan)" }}
                >
                  FOCUS · {selectedRow.country}
                </span>
                <button
                  onClick={() => setSelectedCountry(null)}
                  className="p-0.5 text-[var(--fg-mute)] hover:text-[var(--danger)]"
                  aria-label="Clear"
                >
                  <X size={11} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Stat
                  label="SITES"
                  value={String(selectedRow.count)}
                  accent="fg"
                />
                <Stat
                  label="TOTAL"
                  value={formatMW(selectedRow.totalMW).replace(" MW", "")}
                  suffix="MW"
                  accent="fg"
                />
                <Stat
                  label="AI MW"
                  value={formatMW(selectedRow.aiMW).replace(" MW", "")}
                  suffix="MW"
                  accent="cyan"
                />
                <Stat
                  label="AI %"
                  value={formatPct(selectedRow.aiPct)}
                  accent={selectedRow.aiPct >= 20 ? "cyan" : "amber"}
                />
              </div>
            </div>
          )}

          <div className="max-h-[280px] overflow-y-auto">
            {rows.map((r) => {
              const active = selectedCountry === r.country;
              return (
                <button
                  key={r.country}
                  onClick={() =>
                    setSelectedCountry(active ? null : r.country)
                  }
                  className={`w-full flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-soft)]/40 transition-colors text-left ${
                    active
                      ? "bg-[var(--cyan)]/8"
                      : "hover:bg-[var(--bg-1)]/50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="hud-label tabular-nums w-5 shrink-0"
                      style={{
                        color: active
                          ? "var(--cyan)"
                          : "var(--fg-dim)",
                      }}
                    >
                      {COUNTRY_CODE[r.country] ?? r.country.slice(0, 2).toUpperCase()}
                    </span>
                    <span
                      className="text-[12px] truncate"
                      style={{
                        color: active ? "var(--fg-0)" : "var(--fg-mute)",
                      }}
                    >
                      {r.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="text-[11px] tabular-nums"
                      style={{
                        color: active ? "var(--fg-0)" : "var(--fg-mute)",
                      }}
                    >
                      {formatMW(r.totalMW).replace(" MW", "")}
                    </span>
                    <span
                      className="text-[10px] tabular-nums w-5 text-right"
                      style={{ color: "var(--fg-dim)" }}
                    >
                      ·{r.count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}

function Stat({
  label,
  value,
  suffix,
  accent = "fg",
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: "cyan" | "amber" | "fg";
}) {
  const color =
    accent === "cyan"
      ? "var(--cyan)"
      : accent === "amber"
        ? "var(--amber)"
        : "var(--fg-0)";
  return (
    <div>
      <div className="hud-label">{label}</div>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span
          className="text-[15px] chromatic tabular-nums"
          style={{ color, fontWeight: 500 }}
        >
          {value}
        </span>
        {suffix && (
          <span
            className="text-[10px]"
            style={{ color: "var(--fg-dim)" }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
