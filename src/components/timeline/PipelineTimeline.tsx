import { useMemo, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Dataset, DataCenter, SiteStatus } from "@/types";
import { useAppStore } from "@/state/useAppStore";

// Derived time spans for each status bucket. These are intentionally simple
// "convention bands" because the dataset doesn't carry per-site milestone
// dates; keeping the rules explicit means readers can judge the chart honestly.
const PRESENT_YEAR = 2026;
const LEFT_YEAR = 2022;
const RIGHT_YEAR = 2030;

function statusSpan(site: DataCenter): { start: number; end: number; solid: boolean } {
  const commissioned = site.commissioned
    ? parseInt(site.commissioned.slice(0, 4), 10)
    : NaN;
  switch (site.status) {
    case "operational":
      return {
        start: Number.isFinite(commissioned) ? commissioned : 2024,
        end: PRESENT_YEAR,
        solid: true,
      };
    case "under_construction":
      return {
        start: Number.isFinite(commissioned) ? commissioned : PRESENT_YEAR - 0.5,
        end: PRESENT_YEAR + 1,
        solid: false,
      };
    case "planned":
      return { start: PRESENT_YEAR + 0.5, end: PRESENT_YEAR + 2, solid: false };
    case "announced":
      return { start: PRESENT_YEAR + 1, end: PRESENT_YEAR + 3, solid: false };
    case "decommissioned":
      return {
        start: Number.isFinite(commissioned) ? commissioned : 2022,
        end: PRESENT_YEAR - 1,
        solid: true,
      };
  }
}

const STATUS_OPACITY: Record<SiteStatus, number> = {
  operational: 1,
  under_construction: 0.78,
  planned: 0.48,
  announced: 0.32,
  decommissioned: 0.22,
};

const STATUS_LABEL: Record<SiteStatus, string> = {
  operational: "LIVE",
  under_construction: "BUILD",
  planned: "PLAN",
  announced: "ANNC",
  decommissioned: "DEC",
};

export function PipelineTimeline({ dataset }: { dataset: Dataset }) {
  const {
    statusFilters,
    activeTickers,
    setSelectedSiteId,
    setHoveredSiteId,
    hoveredSiteId,
    selectedSiteId,
  } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 1000, h: 620 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () =>
      setDims({
        w: Math.max(520, el.clientWidth),
        h: Math.max(320, el.clientHeight),
      });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const companiesByTicker = useMemo(() => {
    const map: Record<string, (typeof dataset.companies)[number]> = {};
    for (const c of dataset.companies) map[c.ticker] = c;
    return map;
  }, [dataset.companies]);

  // Lanes: one row per ticker, ordered by total MW desc so the biggest
  // operators sit at the top.
  const lanes = useMemo(() => {
    const filtered = dataset.sites.filter(
      (s) =>
        statusFilters.has(s.status) &&
        (activeTickers.size === 0 || activeTickers.has(s.companyTicker)),
    );
    const byTicker: Record<string, DataCenter[]> = {};
    for (const s of filtered) {
      (byTicker[s.companyTicker] ??= []).push(s);
    }
    const rows = Object.entries(byTicker).map(([ticker, sites]) => ({
      ticker,
      sites,
      totalMW: sites.reduce((a, s) => a + s.capacity.currentMW, 0),
    }));
    rows.sort((a, b) => b.totalMW - a.totalMW);
    return rows;
  }, [dataset.sites, statusFilters, activeTickers]);

  const padding = { top: 44, right: 32, bottom: 48, left: 92 };
  const innerW = dims.w - padding.left - padding.right;
  const innerH = dims.h - padding.top - padding.bottom;

  const xOf = (year: number) =>
    padding.left +
    ((year - LEFT_YEAR) / (RIGHT_YEAR - LEFT_YEAR)) * innerW;

  const laneH = lanes.length > 0 ? innerH / lanes.length : innerH;
  const yOf = (laneIdx: number) => padding.top + laneIdx * laneH + laneH / 2;

  // Bar thickness scales log-ish with currentMW / finalTarget.
  const barThickness = (site: DataCenter) => {
    const mw = Math.max(
      site.capacity.currentMW,
      site.capacity.plannedMW ?? 0,
      site.capacity.finalTargetMW ?? 0,
    );
    return Math.max(4, Math.min(22, 3 + Math.sqrt(mw) * 0.7));
  };

  const yearTicks = [2022, 2024, 2026, 2028, 2030];

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <motion.svg
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        width={dims.w}
        height={dims.h}
        style={{ display: "block" }}
      >
        {/* Year gridlines */}
        {yearTicks.map((y) => (
          <line
            key={`gx-${y}`}
            x1={xOf(y)}
            x2={xOf(y)}
            y1={padding.top - 4}
            y2={padding.top + innerH}
            stroke="var(--border-soft)"
            strokeWidth="0.5"
            strokeDasharray="2 4"
          />
        ))}

        {/* Present-year marker */}
        <line
          x1={xOf(PRESENT_YEAR)}
          x2={xOf(PRESENT_YEAR)}
          y1={padding.top - 8}
          y2={padding.top + innerH + 4}
          stroke="var(--cyan)"
          strokeWidth="1"
          opacity="0.7"
        />
        <text
          x={xOf(PRESENT_YEAR)}
          y={padding.top - 14}
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="9"
          letterSpacing="0.2em"
          fill="var(--cyan)"
        >
          ◀ NOW ▶
        </text>

        {/* Year axis labels */}
        {yearTicks.map((y) => (
          <text
            key={`tx-${y}`}
            x={xOf(y)}
            y={padding.top + innerH + 18}
            textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="10"
            fill="var(--fg-mute)"
            letterSpacing="0.1em"
          >
            {y}
          </text>
        ))}

        {/* Axis title */}
        <text
          x={padding.left + innerW / 2}
          y={dims.h - 10}
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--cyan)"
        >
          COMMISSIONING TIMELINE ·→
        </text>

        {/* Lane rows */}
        {lanes.map((lane, idx) => {
          const y = yOf(idx);
          const company = companiesByTicker[lane.ticker];
          return (
            <g key={lane.ticker}>
              {/* Lane baseline */}
              <line
                x1={padding.left}
                x2={padding.left + innerW}
                y1={y}
                y2={y}
                stroke="var(--border-soft)"
                strokeWidth="0.4"
                strokeDasharray="1 3"
                opacity="0.5"
              />
              {/* Lane label */}
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="11"
                fontWeight={500}
                fill={company?.color ?? "var(--fg-0)"}
                letterSpacing="0.12em"
              >
                {lane.ticker}
              </text>
              <text
                x={padding.left - 10}
                y={y + 16}
                textAnchor="end"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="8"
                fill="var(--fg-mute)"
                letterSpacing="0.08em"
              >
                {Math.round(lane.totalMW)} MW
              </text>

              {/* Site bars within this lane */}
              {lane.sites.map((site, si) => {
                const span = statusSpan(site);
                const x1 = xOf(span.start);
                const x2 = xOf(span.end);
                const thickness = barThickness(site);
                // Stagger sites slightly so overlaps stay readable.
                const yOffset = (si % 2 === 0 ? -1 : 1) * Math.min(7, laneH / 5);
                const barY = y + yOffset;
                const color = company?.color ?? "#22d3ee";
                const selected = selectedSiteId === site.id;
                const hovered = hoveredSiteId === site.id;
                const emphasised = selected || hovered;
                return (
                  <g
                    key={site.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedSiteId(site.id)}
                    onMouseEnter={() => setHoveredSiteId(site.id)}
                    onMouseLeave={() => setHoveredSiteId(null)}
                  >
                    <rect
                      x={x1}
                      y={barY - thickness / 2}
                      width={Math.max(3, x2 - x1)}
                      height={thickness}
                      fill={color}
                      fillOpacity={STATUS_OPACITY[site.status] * 0.45}
                      stroke={color}
                      strokeWidth={emphasised ? 1.8 : 0.8}
                      strokeDasharray={span.solid ? undefined : "3 3"}
                      style={{
                        filter: emphasised
                          ? `drop-shadow(0 0 8px ${color})`
                          : "none",
                        transition: "all 180ms",
                      }}
                    />
                    {/* Status chip floats just above the bar when hovered */}
                    {emphasised && (
                      <text
                        x={x1 + 4}
                        y={barY - thickness / 2 - 4}
                        fontFamily="'JetBrains Mono', monospace"
                        fontSize="9"
                        fill="var(--fg-0)"
                        letterSpacing="0.14em"
                      >
                        {site.name} · {site.capacity.currentMW}MW ·{" "}
                        {STATUS_LABEL[site.status]}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Legend (top-right): status dash semantics */}
        <g transform={`translate(${padding.left + innerW - 210}, 12)`}>
          <text
            x="0"
            y="0"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="9"
            letterSpacing="0.18em"
            fill="var(--fg-mute)"
          >
            STATUS
          </text>
          <g transform="translate(56, -4)">
            <rect x="0" y="0" width="22" height="6" fill="var(--cyan)" fillOpacity="0.45" stroke="var(--cyan)" strokeWidth="0.8" />
            <text x="28" y="6" fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="var(--fg-0)">LIVE</text>
          </g>
          <g transform="translate(110, -4)">
            <rect x="0" y="0" width="22" height="6" fill="var(--cyan)" fillOpacity="0.25" stroke="var(--cyan)" strokeWidth="0.8" strokeDasharray="3 3" />
            <text x="28" y="6" fontFamily="'JetBrains Mono', monospace" fontSize="9" fill="var(--fg-mute)">PLANNED</text>
          </g>
        </g>
      </motion.svg>
    </div>
  );
}
