import { motion } from "framer-motion";
import { useAppStore } from "@/state/useAppStore";
import type { Dataset } from "@/types";
import { HUDFrame } from "@/components/hud/HUDFrame";

export function Legend({ dataset }: { dataset: Dataset }) {
  const { viewMode } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.4 }}
    >
      <HUDFrame title="KEY" padding="sm" accent="cyan" bracketSize={8}>
        <div className="flex flex-col gap-3 min-w-[220px]">
          {viewMode === "ai_allocation" ? (
            <div>
              <div className="hud-label mb-1.5">AI / HPC SHARE</div>
              <div
                className="h-2 w-full"
                style={{
                  background:
                    "linear-gradient(90deg, #f59e0b 0%, #22d3ee 100%)",
                }}
              />
              <div className="flex justify-between mt-1 hud-meta">
                <span>BTC-ONLY</span>
                <span>100% AI</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="hud-label mb-1.5">OPERATORS</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {dataset.companies.map((c) => (
                  <div
                    key={c.ticker}
                    className="flex items-center gap-1.5 text-[11px]"
                  >
                    <span
                      className="w-2 h-2"
                      style={{ background: c.color }}
                    />
                    <span style={{ color: "var(--fg-0)" }}>{c.ticker}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-[var(--border-soft)] pt-2">
            <div className="hud-label mb-1.5">SITE SIZE · MW</div>
            <div className="flex items-end gap-4 text-[10px]">
              {[50, 200, 500].map((mw) => {
                const r = 4 + Math.sqrt(mw) / 2;
                return (
                  <div
                    key={mw}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <span
                      className="rounded-full block"
                      style={{
                        width: r * 2,
                        height: r * 2,
                        background: "var(--cyan)",
                        boxShadow: "0 0 4px var(--cyan-glow)",
                      }}
                    />
                    <span style={{ color: "var(--fg-mute)" }}>{mw}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </HUDFrame>
    </motion.div>
  );
}
