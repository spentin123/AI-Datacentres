import { useMemo, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import announcementsData from "@/data/announcements.json";
import { useAppStore } from "@/state/useAppStore";
import type { Dataset } from "@/types";

interface Announcement {
  date: string;
  headline: string;
  tickers: string[];
  siteIds: string[];
  url: string;
}

const announcements: Announcement[] = announcementsData.announcements;

export function AnnouncementTicker({ dataset }: { dataset: Dataset }) {
  const { setSelectedSiteId, soloTicker } = useAppStore();
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // Sort newest-first; the ticker reads left-to-right like a news crawl.
  const sorted = useMemo(
    () => [...announcements].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [],
  );

  // Content is rendered twice back-to-back so the CSS translate can loop
  // seamlessly without a JS-driven scroll.
  const [trackWidth, setTrackWidth] = useState(0);
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setTrackWidth(el.scrollWidth / 2);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sorted.length]);

  const activate = (a: Announcement) => {
    // Prefer a site fly-to when possible; otherwise solo the first ticker.
    const firstSite = a.siteIds.find((id) =>
      dataset.sites.some((s) => s.id === id),
    );
    if (firstSite) setSelectedSiteId(firstSite);
    else if (a.tickers[0]) soloTicker(a.tickers[0]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="relative overflow-hidden border-y border-[var(--border-soft)] bg-[var(--bg-0)]/60 backdrop-blur-sm"
      style={{ height: 26 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      data-hud
    >
      <span
        className="absolute left-0 top-0 bottom-0 flex items-center px-2 z-10 hud-label"
        style={{
          color: "var(--cyan)",
          letterSpacing: "0.22em",
          background:
            "linear-gradient(90deg, var(--bg-0) 70%, transparent 100%)",
        }}
      >
        ▣ NEWS
      </span>
      <div
        ref={trackRef}
        className="flex items-center h-full whitespace-nowrap will-change-transform"
        style={{
          animation: trackWidth
            ? `ticker-scroll ${Math.max(20, sorted.length * 8)}s linear infinite`
            : undefined,
          animationPlayState: paused ? "paused" : "running",
          paddingLeft: 64,
        }}
      >
        {[...sorted, ...sorted].map((a, i) => (
          <button
            key={`${a.date}-${i}`}
            onClick={() => activate(a)}
            className="flex items-center gap-2 px-4 font-mono text-[11px] tracking-wider hover:text-[var(--cyan)] transition-colors"
            style={{ color: "var(--fg-mute)" }}
          >
            <span style={{ color: "var(--cyan-glow)" }}>{a.date}</span>
            <span style={{ color: "var(--fg-dim)" }}>·</span>
            <span>{a.headline}</span>
            <span style={{ color: "var(--fg-dim)" }}>·</span>
          </button>
        ))}
      </div>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-${trackWidth}px); }
        }
      `}</style>
    </motion.div>
  );
}
