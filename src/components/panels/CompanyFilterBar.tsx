import { motion } from "framer-motion";
import { useMemo } from "react";
import type { Dataset } from "@/types";
import { useAppStore } from "@/state/useAppStore";
import { sitesByCompany } from "@/lib/derive";

export function CompanyFilterBar({ dataset }: { dataset: Dataset }) {
  const { activeTickers, toggleTicker, soloTicker, resetTickers } =
    useAppStore();

  const byCompany = useMemo(
    () => sitesByCompany(dataset.sites),
    [dataset.sites],
  );

  const allTickers = dataset.companies.map((c) => c.ticker);
  const showingAll = activeTickers.size === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.2 }}
      className="flex items-center gap-2 flex-nowrap w-max"
    >
      <button
        onClick={() => resetTickers([])}
        className={`hud-label px-2.5 py-1 border transition-all ${
          showingAll
            ? "border-[var(--cyan)] text-[var(--cyan)] shadow-cyan-glow bg-[var(--cyan)]/5"
            : "border-[var(--border-soft)] text-[var(--fg-mute)] hover:border-[var(--border-hard)]"
        }`}
      >
        ALL
      </button>
      {dataset.companies.map((c) => {
        const active = showingAll || activeTickers.has(c.ticker);
        const count = byCompany[c.ticker]?.length ?? 0;
        return (
          <button
            key={c.ticker}
            onClick={(e) => {
              if (e.shiftKey) soloTicker(c.ticker);
              else if (showingAll) soloTicker(c.ticker);
              else toggleTicker(c.ticker);
            }}
            className={`group flex items-center gap-1.5 px-2.5 py-1 border transition-all ${
              active
                ? "border-[var(--border-hard)] bg-[var(--bg-1)]/70"
                : "border-[var(--border-soft)] bg-transparent opacity-45 hover:opacity-80"
            }`}
            title={`${c.name} — ${count} sites. Shift-click to solo.`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: c.color,
                boxShadow: active ? `0 0 6px ${c.color}` : "none",
              }}
            />
            <span
              className="hud-label"
              style={{ color: active ? "var(--fg-0)" : "var(--fg-mute)" }}
            >
              {c.ticker}
            </span>
            <span
              className="text-[10px] tabular-nums"
              style={{ color: "var(--fg-dim)" }}
            >
              ·{count}
            </span>
          </button>
        );
      })}
      {!showingAll && allTickers.length - activeTickers.size > 0 && (
        <button
          onClick={() => resetTickers([])}
          className="hud-label px-2 py-1 text-[var(--amber)] hover:text-[var(--amber-glow)]"
        >
          RESET
        </button>
      )}
    </motion.div>
  );
}
