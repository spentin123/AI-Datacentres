import type { SiteStatus } from "@/types";

const statusMap: Record<SiteStatus, { label: string; color: string }> = {
  operational: { label: "OPERATIONAL", color: "var(--ok)" },
  under_construction: { label: "CONSTRUCTION", color: "var(--amber)" },
  planned: { label: "PLANNED", color: "var(--cyan)" },
  announced: { label: "ANNOUNCED", color: "var(--cyan-glow)" },
  decommissioned: { label: "DECOM", color: "var(--danger)" },
};

export function StatusChip({ status }: { status: SiteStatus }) {
  const s = statusMap[status];
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-[var(--border-soft)] bg-[var(--bg-1)]/60">
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse-soft"
        style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }}
      />
      <span
        className="hud-label"
        style={{ color: s.color, letterSpacing: "0.15em" }}
      >
        {s.label}
      </span>
    </div>
  );
}
