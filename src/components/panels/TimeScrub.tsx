import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, X } from "lucide-react";
import { useAppStore } from "@/state/useAppStore";

const MIN_YEAR = 2022;
const MAX_YEAR = 2028;
const PLAY_SECONDS = 14;

export function TimeScrub() {
  const { scrubYear, setScrubYear } = useAppStore();
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);

  const active = scrubYear != null;

  const stopPlayback = () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPlaying(false);
  };

  useEffect(() => () => stopPlayback(), []);

  const startPlayback = () => {
    setPlaying(true);
    const startYear = scrubYear ?? MIN_YEAR;
    const startedAt = performance.now();
    const range = MAX_YEAR - startYear;
    const tick = () => {
      const t = (performance.now() - startedAt) / (PLAY_SECONDS * 1000);
      const y = Math.min(MAX_YEAR, startYear + t * range);
      setScrubYear(Math.round(y * 10) / 10);
      if (y < MAX_YEAR) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setPlaying(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const togglePlay = () => {
    if (playing) stopPlayback();
    else startPlayback();
  };

  const onSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    stopPlayback();
    setScrubYear(parseFloat(e.target.value));
  };

  const exit = () => {
    stopPlayback();
    setScrubYear(null);
  };

  // Fractional year display as YYYY · Qn.
  const label = (() => {
    if (scrubYear == null) return "LIVE";
    const whole = Math.floor(scrubYear);
    const frac = scrubYear - whole;
    const q = Math.min(4, Math.max(1, Math.floor(frac * 4) + 1));
    return `${whole} · Q${q}`;
  })();

  if (!active) {
    return (
      <button
        onClick={() => setScrubYear(MIN_YEAR)}
        className="flex items-center gap-1.5 px-2.5 py-1 border border-[var(--border-soft)] hover:border-[var(--cyan)] hud-label transition-colors"
        style={{ color: "var(--cyan-glow)", letterSpacing: "0.18em" }}
      >
        ◷ SCRUB 2022→28
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-3 px-2.5 py-1 border border-[var(--cyan)]/60 bg-[var(--bg-0)]/70"
    >
      <button
        onClick={togglePlay}
        className="p-0.5 hover:text-[var(--cyan)] transition-colors"
        style={{ color: "var(--cyan)" }}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause size={12} /> : <Play size={12} />}
      </button>
      <span
        className="hud-label font-mono min-w-[80px]"
        style={{ color: "var(--cyan)", letterSpacing: "0.2em" }}
      >
        {label}
      </span>
      <input
        type="range"
        min={MIN_YEAR}
        max={MAX_YEAR}
        step={0.25}
        value={scrubYear}
        onChange={onSlider}
        className="flex-1 min-w-[220px] accent-[var(--cyan)]"
      />
      <div className="flex items-center gap-1 hud-label" style={{ color: "var(--fg-dim)" }}>
        <span>{MIN_YEAR}</span>
        <span>→</span>
        <span>{MAX_YEAR}</span>
      </div>
      <button
        onClick={exit}
        className="p-0.5 hover:text-[var(--amber)] transition-colors"
        style={{ color: "var(--fg-mute)" }}
        aria-label="Exit scrub"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}
