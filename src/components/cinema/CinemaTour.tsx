import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square } from "lucide-react";
import type { Dataset } from "@/types";
import { useAppStore } from "@/state/useAppStore";

interface Stop {
  siteId: string;
  narration: string;
}

// Curated tour — hero sites that tell the Bitcoin-miner → AI pivot story.
const TOUR: Stop[] = [
  {
    siteId: "wulf-lake-mariner",
    narration:
      "LAKE MARINER · zero-carbon hydro flagship. Core42 + Fluidstack anchor tenants; 245MW live, 750MW final target.",
  },
  {
    siteId: "corz-denton",
    narration:
      "DENTON · CoreWeave 12-year, >$10B hosting conversion. Phase 1 live, Phase 2 under construction.",
  },
  {
    siteId: "iren-childress",
    narration:
      "CHILDRESS · 350MW operational, 750MW final. IREN × Microsoft $9.7B AI colo signed April 2026.",
  },
  {
    siteId: "apld-ellendale",
    narration:
      "ELLENDALE · 100MW live, 400MW target. Applied Digital is functionally pure HPC — CoreWeave anchor.",
  },
  {
    siteId: "hut-vega",
    narration:
      "VEGA · Hut 8 × Highbank 205MW AI-only campus. Planned; hybrid fleet's pivot commitment.",
  },
  {
    siteId: "mara-abu-dhabi",
    narration:
      "ABU DHABI JV · MARA's international foothold. 250MW operational; AI pilot underway.",
  },
  {
    siteId: "hive-yguazu",
    narration:
      "YGUAZÚ · Itaipu-hydro GPU fleet, Paraguay. 100MW live scaling to 200MW; earliest AI pivot on the roster.",
  },
  {
    siteId: "cifr-black-pearl",
    narration:
      "BLACK PEARL · Cipher's 300MW HPC build broke ground Jan 2026. BTC-to-HPC conversion in flight.",
  },
];

const STOP_MS = 5000;

export function CinemaTour({ dataset }: { dataset: Dataset }) {
  const {
    cinemaActive,
    setCinemaActive,
    setSelectedSiteId,
    setDisplayMode,
    displayMode,
  } = useAppStore();
  const [stopIdx, setStopIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const stops = useMemo(
    () =>
      TOUR.filter((stop) => dataset.sites.some((s) => s.id === stop.siteId)),
    [dataset.sites],
  );

  // Esc or any other nav key exits.
  useEffect(() => {
    if (!cinemaActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" ||
        e.key === " " ||
        e.key === "Enter" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowLeft"
      ) {
        e.preventDefault();
        setCinemaActive(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cinemaActive, setCinemaActive]);

  // Advance through stops.
  useEffect(() => {
    if (!cinemaActive) {
      setStopIdx(0);
      setProgress(0);
      return;
    }
    if (displayMode !== "globe") setDisplayMode("globe");
    const stop = stops[stopIdx];
    if (!stop) {
      setCinemaActive(false);
      return;
    }
    setSelectedSiteId(stop.siteId);
    setProgress(0);
    const startedAt = performance.now();
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - startedAt) / STOP_MS;
      setProgress(Math.min(1, t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const timer = setTimeout(() => {
      if (stopIdx + 1 < stops.length) {
        setStopIdx((i) => i + 1);
      } else {
        setCinemaActive(false);
        setSelectedSiteId(null);
      }
    }, STOP_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [
    cinemaActive,
    stopIdx,
    stops,
    setSelectedSiteId,
    setCinemaActive,
    displayMode,
    setDisplayMode,
  ]);

  const currentStop = stops[stopIdx];
  const currentSite = currentStop
    ? dataset.sites.find((s) => s.id === currentStop.siteId)
    : null;

  return (
    <>
      {/* Launch button — bottom-left, small, always accessible in globe mode */}
      {!cinemaActive && (
        <button
          onClick={() => setCinemaActive(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 border border-[var(--border-soft)] hover:border-[var(--cyan)] hud-label transition-colors"
          style={{
            color: "var(--cyan)",
            letterSpacing: "0.18em",
          }}
        >
          <Play size={11} />
          CINEMA
        </button>
      )}

      <AnimatePresence>
        {cinemaActive && currentStop && currentSite && (
          <motion.div
            key="cinema-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 z-40 pointer-events-none"
            data-hud
          >
            {/* Cinema letterboxing */}
            <div className="absolute top-0 left-0 right-0 h-[8vh] bg-[var(--bg-0)]/90 border-b border-[var(--cyan)]/40" />
            <div className="absolute bottom-0 left-0 right-0 h-[14vh] bg-[var(--bg-0)]/90 border-t border-[var(--cyan)]/40" />

            {/* Top-center: stop counter + progress segments */}
            <div className="absolute top-[2vh] left-1/2 -translate-x-1/2 flex items-center gap-2">
              {stops.map((_, i) => (
                <div
                  key={i}
                  className="h-[2px] w-6"
                  style={{
                    background:
                      i < stopIdx
                        ? "var(--cyan)"
                        : i === stopIdx
                          ? `linear-gradient(90deg, var(--cyan) ${progress * 100}%, var(--border-soft) ${progress * 100}%)`
                          : "var(--border-soft)",
                  }}
                />
              ))}
            </div>
            <div
              className="absolute top-[4vh] left-1/2 -translate-x-1/2 hud-label"
              style={{
                color: "var(--cyan)",
                letterSpacing: "0.26em",
              }}
            >
              CINEMA · {stopIdx + 1}/{stops.length}
            </div>

            {/* Bottom narration */}
            <div className="absolute bottom-[2vh] left-1/2 -translate-x-1/2 w-[min(860px,calc(100%-4rem))] text-center">
              <div
                className="hud-label mb-1"
                style={{
                  color: "var(--fg-mute)",
                  letterSpacing: "0.22em",
                }}
              >
                TARGET · {currentSite.companyTicker} · {currentSite.name}
              </div>
              <motion.div
                key={currentStop.siteId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="font-mono text-[15px] md:text-base leading-relaxed"
                style={{
                  color: "var(--fg-0)",
                  textShadow: "0 0 10px var(--cyan-glow)",
                }}
              >
                {currentStop.narration}
              </motion.div>
              <div
                className="mt-2 hud-label"
                style={{
                  color: "var(--fg-dim)",
                  letterSpacing: "0.2em",
                }}
              >
                ESC / SPACE / ⏎ — EXIT
              </div>
            </div>

            {/* Exit button (pointer-events-enabled) */}
            <button
              onClick={() => setCinemaActive(false)}
              className="absolute top-[2vh] right-4 flex items-center gap-1.5 px-2.5 py-1 border border-[var(--amber)]/60 hover:border-[var(--amber)] hud-label pointer-events-auto"
              style={{
                color: "var(--amber)",
                letterSpacing: "0.18em",
              }}
            >
              <Square size={11} />
              END
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
