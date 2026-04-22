import { useMemo, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Dataset } from "@/types";
import { useAppStore } from "@/state/useAppStore";
import {
  siteAiMW,
  totalCurrentMW,
  totalAiMW,
  sitesByCompany,
} from "@/lib/derive";
import { formatMW } from "@/lib/format";

const STRATEGY_COLOR: Record<string, string> = {
  pureplay_ai: "#22d3ee",
  hybrid: "#f59e0b",
  exploring: "#64748b",
};

interface CompanyDatum {
  ticker: string;
  name: string;
  color: string;
  strategy: string;
  aiMW: number;
  totalMW: number;
  marketCap: number;
  siteCount: number;
  firstSiteId: string | null;
}

export function TickerMatrix({ dataset }: { dataset: Dataset }) {
  const {
    statusFilters,
    activeTickers,
    setSelectedSiteId,
    setHoveredSiteId,
    hoveredSiteId,
  } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 900, h: 620 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () =>
      setDims({
        w: Math.max(480, el.clientWidth),
        h: Math.max(360, el.clientHeight),
      });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo<CompanyDatum[]>(() => {
    const filteredSites = dataset.sites.filter((s) =>
      statusFilters.has(s.status),
    );
    const byCompany = sitesByCompany(filteredSites);
    return dataset.companies
      .filter((c) => !!byCompany[c.ticker]?.length)
      .map((c) => {
        const sites = byCompany[c.ticker];
        return {
          ticker: c.ticker,
          name: c.name,
          color: c.color,
          strategy: c.aiStrategy,
          aiMW: totalAiMW(sites),
          totalMW: totalCurrentMW(sites),
          marketCap: c.marketCapUsdM ?? 0,
          siteCount: sites.length,
          firstSiteId:
            sites.reduce((best, s) => (siteAiMW(s) > siteAiMW(best) ? s : best))
              ?.id ?? null,
        };
      })
      .filter((d) => d.marketCap > 0);
  }, [dataset.sites, dataset.companies, statusFilters]);

  const padding = { top: 32, right: 44, bottom: 48, left: 64 };
  const innerW = dims.w - padding.left - padding.right;
  const innerH = dims.h - padding.top - padding.bottom;

  // Log scales with stable hand-picked domains so the plot doesn't
  // rescale every time the user flips a filter.
  const xTicks = [1, 10, 100, 1000];
  const yTicks = [100, 1000, 10000];
  const xMin = 0.5,
    xMax = 1500;
  const yMin = 80,
    yMax = 15000;
  const logScale = (v: number, min: number, max: number, range: number) => {
    const lv = Math.log10(Math.max(v, min));
    const lmin = Math.log10(min);
    const lmax = Math.log10(max);
    return ((lv - lmin) / (lmax - lmin)) * range;
  };
  const xOf = (v: number) => padding.left + logScale(v, xMin, xMax, innerW);
  const yOf = (v: number) =>
    padding.top + innerH - logScale(v, yMin, yMax, innerH);

  // Bubble radius: sqrt of totalMW, scaled.
  const rOf = (mw: number) => 6 + Math.min(34, Math.sqrt(Math.max(1, mw)) * 1.4);

  const fadeTicker = (ticker: string) =>
    activeTickers.size > 0 && !activeTickers.has(ticker);

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
        {/* Faint gridlines */}
        {xTicks.map((t) => (
          <line
            key={`gx-${t}`}
            x1={xOf(t)}
            x2={xOf(t)}
            y1={padding.top}
            y2={padding.top + innerH}
            stroke="var(--border-soft)"
            strokeWidth="0.5"
            strokeDasharray="2 4"
          />
        ))}
        {yTicks.map((t) => (
          <line
            key={`gy-${t}`}
            x1={padding.left}
            x2={padding.left + innerW}
            y1={yOf(t)}
            y2={yOf(t)}
            stroke="var(--border-soft)"
            strokeWidth="0.5"
            strokeDasharray="2 4"
          />
        ))}

        {/* Axes */}
        <line
          x1={padding.left}
          x2={padding.left + innerW}
          y1={padding.top + innerH}
          y2={padding.top + innerH}
          stroke="var(--cyan)"
          strokeWidth="1"
          opacity="0.6"
        />
        <line
          x1={padding.left}
          x2={padding.left}
          y1={padding.top}
          y2={padding.top + innerH}
          stroke="var(--cyan)"
          strokeWidth="1"
          opacity="0.6"
        />

        {/* Axis labels */}
        {xTicks.map((t) => (
          <text
            key={`tx-${t}`}
            x={xOf(t)}
            y={padding.top + innerH + 18}
            textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="10"
            fill="var(--fg-mute)"
            letterSpacing="0.1em"
          >
            {t < 10 ? t.toString() : t < 1000 ? `${t}` : `${t / 1000}k`}
          </text>
        ))}
        {yTicks.map((t) => (
          <text
            key={`ty-${t}`}
            x={padding.left - 10}
            y={yOf(t) + 3}
            textAnchor="end"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="10"
            fill="var(--fg-mute)"
            letterSpacing="0.1em"
          >
            {t < 1000 ? `$${t}M` : `$${t / 1000}B`}
          </text>
        ))}

        {/* Axis titles */}
        <text
          x={padding.left + innerW / 2}
          y={dims.h - 10}
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--cyan)"
        >
          AI / HPC MW ·→
        </text>
        <text
          x={-padding.top - innerH / 2}
          y={14}
          transform="rotate(-90)"
          textAnchor="middle"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--cyan)"
        >
          MARKET CAP ·→
        </text>

        {/* Diagonal: equal $1M market cap per MW AI (rough reference line) */}
        <line
          x1={xOf(1)}
          y1={yOf(10 * 1)}
          x2={xOf(1500)}
          y2={yOf(10 * 1500)}
          stroke="var(--fg-mute)"
          strokeWidth="0.5"
          strokeDasharray="3 4"
          opacity="0.35"
        />

        {/* Quadrant hint */}
        <text
          x={padding.left + 10}
          y={padding.top + 18}
          fontFamily="'JetBrains Mono', monospace"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--amber)"
          opacity="0.7"
        >
          ← RICH · LOW AI
        </text>
        <text
          x={padding.left + innerW - 10}
          y={padding.top + innerH - 10}
          textAnchor="end"
          fontFamily="'JetBrains Mono', monospace"
          fontSize="9"
          letterSpacing="0.18em"
          fill="var(--cyan-glow)"
          opacity="0.7"
        >
          CHEAP · AI-HEAVY →
        </text>

        {/* Bubbles */}
        {data.map((d) => {
          const x = xOf(Math.max(d.aiMW, xMin));
          const y = yOf(d.marketCap);
          const r = rOf(d.totalMW);
          const faded = fadeTicker(d.ticker);
          const color = STRATEGY_COLOR[d.strategy] ?? d.color;
          const hovered = hoveredSiteId === d.firstSiteId;
          return (
            <g
              key={d.ticker}
              style={{
                cursor: "pointer",
                opacity: faded ? 0.18 : 1,
                transition: "opacity 180ms",
              }}
              onClick={() => d.firstSiteId && setSelectedSiteId(d.firstSiteId)}
              onMouseEnter={() =>
                d.firstSiteId && setHoveredSiteId(d.firstSiteId)
              }
              onMouseLeave={() => setHoveredSiteId(null)}
            >
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={color}
                fillOpacity={0.18}
                stroke={color}
                strokeWidth={hovered ? 2 : 1}
                style={{
                  filter: hovered ? `drop-shadow(0 0 10px ${color})` : "none",
                }}
              />
              <circle cx={x} cy={y} r={2} fill={color} />
              <text
                x={x + r + 6}
                y={y + 4}
                fontFamily="'JetBrains Mono', monospace"
                fontSize="11"
                fontWeight={500}
                fill={faded ? "var(--fg-mute)" : "var(--fg-0)"}
                letterSpacing="0.08em"
              >
                {d.ticker}
              </text>
              <text
                x={x + r + 6}
                y={y + 17}
                fontFamily="'JetBrains Mono', monospace"
                fontSize="9"
                fill="var(--fg-mute)"
                letterSpacing="0.05em"
              >
                {formatMW(d.aiMW)} · ${d.marketCap >= 1000 ? `${(d.marketCap / 1000).toFixed(1)}B` : `${Math.round(d.marketCap)}M`}
              </text>
            </g>
          );
        })}

        {/* Strategy legend (top-right inside plot) */}
        <g transform={`translate(${padding.left + innerW - 150}, ${padding.top + 8})`}>
          <text
            x="0"
            y="0"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="9"
            letterSpacing="0.18em"
            fill="var(--fg-mute)"
          >
            STRATEGY
          </text>
          {Object.entries(STRATEGY_COLOR).map(([k, v], i) => (
            <g key={k} transform={`translate(0, ${14 + i * 13})`}>
              <circle cx="4" cy="-4" r="3" fill={v} />
              <text
                x="14"
                y="0"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="9"
                letterSpacing="0.14em"
                fill="var(--fg-0)"
              >
                {k.replace("_", " ").toUpperCase()}
              </text>
            </g>
          ))}
        </g>
      </motion.svg>
    </div>
  );
}
