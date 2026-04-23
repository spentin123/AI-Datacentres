import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, MapPin, Building2, Printer } from "lucide-react";
import type { DataCenter, Company } from "@/types";
import { useAppStore } from "@/state/useAppStore";
import { CornerBrackets } from "@/components/hud/CornerBrackets";
import { StatusChip } from "@/components/primitives/StatusChip";
import { ConfidenceBadge } from "@/components/primitives/ConfidenceBadge";
import { MetricReadout } from "@/components/primitives/MetricReadout";
import { SourceList } from "@/components/primitives/SourceList";
import { OperatorBrief } from "@/components/panels/OperatorBrief";
import { formatMW, formatPct } from "@/lib/format";
import { isSiteStale, newestSourceDate } from "@/lib/derive";

interface Props {
  sites: DataCenter[];
  companies: Company[];
}

export function SiteDetailPanel({ sites, companies }: Props) {
  const { selectedSiteId, setSelectedSiteId } = useAppStore();

  const site = useMemo(
    () => sites.find((s) => s.id === selectedSiteId) ?? null,
    [sites, selectedSiteId],
  );
  const company = useMemo(
    () => companies.find((c) => c.ticker === site?.companyTicker) ?? null,
    [companies, site],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedSiteId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSelectedSiteId]);

  return (
    <AnimatePresence>
      {site && company && (
        <motion.aside
          key={site.id}
          initial={{ x: "110%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "110%", opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 240 }}
          className="absolute right-0 top-0 h-full w-full md:w-[440px] z-30 flex"
        >
          <div className="relative glass w-full h-full flex flex-col overflow-hidden">
            <CornerBrackets size={14} color="var(--cyan)" inset={-1} />

            {/* Header */}
            <div className="p-5 border-b border-[var(--border-soft)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="hud-label px-2 py-0.5 border"
                      style={{
                        color: company.color,
                        borderColor: company.color,
                      }}
                    >
                      {company.ticker}
                    </span>
                    <StatusChip status={site.status} />
                    <ConfidenceBadge level={site.confidence} />
                    {isSiteStale(site) && (
                      <span
                        className="px-1.5 py-0.5 font-mono text-[10px] tracking-widest border"
                        style={{
                          color: "var(--amber)",
                          borderColor: "var(--amber)",
                          opacity: 0.9,
                        }}
                        title={`Newest source: ${newestSourceDate(site)?.toISOString().slice(0, 10) ?? "unknown"}`}
                      >
                        STALE
                      </span>
                    )}
                  </div>
                  <h2
                    className="mt-2 text-2xl chromatic"
                    style={{ fontWeight: 500, letterSpacing: "0.01em" }}
                  >
                    {site.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-1.5 hud-meta">
                    <MapPin size={11} />
                    {site.location.city ? `${site.location.city}, ` : ""}
                    {site.location.region}, {site.location.country}
                    <span style={{ color: "var(--fg-dim)" }} className="ml-2">
                      {site.location.lat.toFixed(2)}°,{" "}
                      {site.location.lng.toFixed(2)}°
                    </span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      document.body.classList.add("print-mode");
                      const done = () => {
                        document.body.classList.remove("print-mode");
                        window.removeEventListener("afterprint", done);
                      };
                      window.addEventListener("afterprint", done);
                      requestAnimationFrame(() =>
                        requestAnimationFrame(() => window.print()),
                      );
                    }}
                    aria-label="Export as PDF"
                    title="Export as PDF"
                    className="p-1 border border-[var(--border-soft)] hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
                    data-no-print
                  >
                    <Printer size={14} />
                  </button>
                  <button
                    onClick={() => setSelectedSiteId(null)}
                    aria-label="Close"
                    className="p-1 border border-[var(--border-soft)] hover:border-[var(--border-hard)] hover:text-[var(--cyan)]"
                    data-no-print
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
              <OperatorBrief company={company} />
              <div className="grid grid-cols-3 gap-4">
                <MetricReadout
                  label="Current"
                  value={formatMW(site.capacity.currentMW).replace(" MW", "")}
                  unit="MW"
                  accent="fg"
                  size="md"
                />
                <MetricReadout
                  label="Planned"
                  value={
                    site.capacity.plannedMW
                      ? formatMW(site.capacity.plannedMW).replace(" MW", "")
                      : "—"
                  }
                  unit="MW"
                  accent="cyan"
                  size="md"
                />
                <MetricReadout
                  label="Target"
                  value={
                    site.capacity.finalTargetMW
                      ? formatMW(site.capacity.finalTargetMW).replace(
                          " MW",
                          "",
                        )
                      : "—"
                  }
                  unit="MW"
                  accent="fg"
                  size="md"
                />
              </div>

              {/* AI / BTC split bar */}
              <div>
                <div className="flex justify-between hud-label mb-1.5">
                  <span>WORKLOAD SPLIT</span>
                  <span style={{ color: "var(--fg-mute)" }}>
                    AI {formatPct(site.workload.aiHpcPct)} · BTC{" "}
                    {formatPct(site.workload.btcMiningPct)}
                    {site.workload.otherPct
                      ? ` · OTHER ${formatPct(site.workload.otherPct)}`
                      : ""}
                  </span>
                </div>
                <div className="relative h-2 w-full bg-[var(--bg-1)] border border-[var(--border-soft)] overflow-hidden flex">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${site.workload.aiHpcPct}%` }}
                    transition={{ duration: 0.7, delay: 0.15 }}
                    style={{
                      background:
                        "linear-gradient(90deg, #22d3ee 0%, #67e8f9 100%)",
                      boxShadow: "0 0 8px rgba(34,211,238,0.5)",
                    }}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${site.workload.btcMiningPct}%` }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    style={{
                      background:
                        "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)",
                    }}
                  />
                </div>
              </div>

              {/* Power + commissioned */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="hud-label mb-1">POWER</div>
                  <div className="flex items-center gap-1.5 text-[13px]">
                    <Zap size={12} style={{ color: "var(--amber)" }} />
                    <span style={{ textTransform: "uppercase" }}>
                      {site.powerSource}
                    </span>
                  </div>
                  {site.powerSourceDetail && (
                    <div className="hud-meta mt-0.5">
                      {site.powerSourceDetail}
                    </div>
                  )}
                </div>
                <div>
                  <div className="hud-label mb-1">COMMISSIONED</div>
                  <div className="text-[13px]">
                    {site.commissioned ?? "—"}
                  </div>
                </div>
              </div>

              {site.tenants && site.tenants.length > 0 && (
                <div>
                  <div className="hud-label mb-1.5 flex items-center gap-1">
                    <Building2 size={10} /> TENANTS
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {site.tenants.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 border border-[var(--border-soft)] text-[11px]"
                        style={{ color: "var(--fg-0)" }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {site.notes && (
                <div>
                  <div className="hud-label mb-1.5">INTELLIGENCE</div>
                  <p className="text-[12.5px] leading-relaxed text-[var(--fg-0)]">
                    {site.notes}
                  </p>
                </div>
              )}

              <SourceList sources={site.sources} />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[var(--border-soft)] flex items-center justify-between hud-meta">
              <span>NODE · {site.id.toUpperCase()}</span>
              <span style={{ color: "var(--fg-dim)" }}>ESC TO CLOSE</span>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
