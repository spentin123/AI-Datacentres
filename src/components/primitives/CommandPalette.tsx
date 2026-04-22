import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Dataset, DataCenter, Company } from "@/types";
import { useAppStore } from "@/state/useAppStore";

type Result =
  | { kind: "site"; site: DataCenter; company: Company | null }
  | { kind: "ticker"; company: Company; siteCount: number }
  | { kind: "country"; country: string; siteCount: number };

function score(query: string, hay: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const h = hay.toLowerCase();
  if (h === q) return 100;
  if (h.startsWith(q)) return 50;
  const idx = h.indexOf(q);
  if (idx >= 0) return 20 - idx * 0.1;
  // Character subsequence — fuzzy fallback.
  let qi = 0;
  for (let i = 0; i < h.length && qi < q.length; i++) {
    if (h[i] === q[qi]) qi++;
  }
  return qi === q.length ? 5 : 0;
}

export function CommandPalette({ dataset }: { dataset: Dataset }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    setSelectedSiteId,
    setSelectedCountry,
    soloTicker,
    setDisplayMode,
  } = useAppStore();

  const companiesByTicker = useMemo(() => {
    const m: Record<string, Company> = {};
    for (const c of dataset.companies) m[c.ticker] = c;
    return m;
  }, [dataset.companies]);

  const countries = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of dataset.sites)
      map.set(s.location.country, (map.get(s.location.country) ?? 0) + 1);
    return Array.from(map.entries()).map(([country, siteCount]) => ({
      country,
      siteCount,
    }));
  }, [dataset.sites]);

  const results = useMemo<Result[]>(() => {
    const items: { r: Result; s: number }[] = [];
    for (const site of dataset.sites) {
      const hay = `${site.name} ${site.companyTicker} ${site.location.country} ${site.location.region} ${site.location.city ?? ""}`;
      const s = score(query, hay);
      if (s > 0)
        items.push({
          r: {
            kind: "site",
            site,
            company: companiesByTicker[site.companyTicker] ?? null,
          },
          s,
        });
    }
    for (const company of dataset.companies) {
      const hay = `${company.ticker} ${company.name}`;
      const s = score(query, hay);
      if (s > 0) {
        const siteCount = dataset.sites.filter(
          (x) => x.companyTicker === company.ticker,
        ).length;
        items.push({
          r: { kind: "ticker", company, siteCount },
          s: s + 3,
        });
      }
    }
    for (const c of countries) {
      const s = score(query, c.country);
      if (s > 0) items.push({ r: { kind: "country", ...c }, s: s + 1 });
    }
    items.sort((a, b) => b.s - a.s);
    return items.slice(0, 14).map((x) => x.r);
  }, [dataset, query, companiesByTicker, countries]);

  // Global open/close hotkeys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA";
      if (!open && !isInput && (e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey)))) {
        e.preventDefault();
        setOpen(true);
        setQuery("");
        setCursor(0);
      } else if (open && e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Global display-mode shortcuts: g/m/t while not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "g") setDisplayMode("globe");
      else if (e.key === "m") setDisplayMode("matrix");
      else if (e.key === "t") setDisplayMode("timeline");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setDisplayMode]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  const activate = (r: Result) => {
    if (r.kind === "site") {
      setSelectedSiteId(r.site.id);
      setSelectedCountry(r.site.location.country);
    } else if (r.kind === "ticker") {
      soloTicker(r.company.ticker);
    } else if (r.kind === "country") {
      setSelectedCountry(r.country);
    }
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[cursor];
      if (r) activate(r);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="absolute inset-0 z-40 flex items-start justify-center pt-[12vh] pointer-events-auto"
          onClick={() => setOpen(false)}
          data-hud
        >
          <div
            className="absolute inset-0 bg-[var(--bg-0)]/70 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -6, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="relative glass w-[min(560px,calc(100%-2rem))] p-0 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-[var(--border-soft)] px-3 py-2">
              <span
                className="hud-label"
                style={{ color: "var(--cyan)", letterSpacing: "0.22em" }}
              >
                ⌖ QUERY
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="site / ticker / country…"
                className="flex-1 bg-transparent outline-none text-[var(--fg-0)] placeholder:text-[var(--fg-dim)] font-mono text-sm"
                autoComplete="off"
                spellCheck={false}
              />
              <span
                className="hud-label"
                style={{ color: "var(--fg-dim)", letterSpacing: "0.14em" }}
              >
                ESC
              </span>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto">
              {results.length === 0 && (
                <li className="px-3 py-4 text-[var(--fg-mute)] font-mono text-xs tracking-widest">
                  NO MATCHES
                </li>
              )}
              {results.map((r, i) => {
                const active = i === cursor;
                return (
                  <li
                    key={
                      r.kind === "site"
                        ? `s:${r.site.id}`
                        : r.kind === "ticker"
                          ? `t:${r.company.ticker}`
                          : `c:${r.country}`
                    }
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => activate(r)}
                    className={`flex items-center justify-between gap-3 px-3 py-2 cursor-pointer border-l-2 ${
                      active
                        ? "bg-[var(--cyan)]/10 border-[var(--cyan)]"
                        : "border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {r.kind === "site" ? (
                        <>
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background: r.company?.color ?? "var(--cyan)",
                              boxShadow: `0 0 6px ${r.company?.color ?? "var(--cyan)"}`,
                            }}
                          />
                          <span className="font-mono text-sm text-[var(--fg-0)] truncate">
                            {r.site.companyTicker} · {r.site.name}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--fg-mute)] tracking-widest">
                            {r.site.location.region}, {r.site.location.country}
                          </span>
                        </>
                      ) : r.kind === "ticker" ? (
                        <>
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: r.company.color }}
                          />
                          <span className="font-mono text-sm text-[var(--fg-0)]">
                            {r.company.ticker}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--fg-mute)] tracking-widest truncate">
                            {r.company.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-sm text-[var(--fg-0)]">
                            {r.country}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--fg-mute)] tracking-widest">
                            COUNTRY
                          </span>
                        </>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-[var(--fg-dim)] tracking-widest shrink-0">
                      {r.kind === "site"
                        ? `${r.site.capacity.currentMW} MW`
                        : r.kind === "ticker"
                          ? `${r.siteCount} SITE${r.siteCount === 1 ? "" : "S"}`
                          : `${r.siteCount} SITE${r.siteCount === 1 ? "" : "S"}`}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between border-t border-[var(--border-soft)] px-3 py-1.5 text-[10px] font-mono tracking-widest text-[var(--fg-dim)]">
              <span>↑↓ NAVIGATE · ⏎ SELECT</span>
              <span>G/M/T · SWITCH VIEW</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
