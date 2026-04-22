import { format } from "d3-format";
import type { Company } from "@/types";

const usdBFmt = format(",.2f");
const usdMFmt = format(",.0f");

function formatUsd(amountUsdM: number | undefined): string {
  if (amountUsdM === undefined) return "—";
  if (amountUsdM >= 1000) return `$${usdBFmt(amountUsdM / 1000)}B`;
  return `$${usdMFmt(amountUsdM)}M`;
}

function strategyLabel(strategy: Company["aiStrategy"]): {
  label: string;
  color: string;
} {
  switch (strategy) {
    case "pureplay_ai":
      return { label: "PURE-PLAY AI", color: "var(--cyan)" };
    case "hybrid":
      return { label: "HYBRID", color: "var(--amber)" };
    case "exploring":
      return { label: "BTC-DOMINANT", color: "var(--fg-mute)" };
  }
}

export function OperatorBrief({ company }: { company: Company }) {
  const { label: stratLabel, color: stratColor } = strategyLabel(
    company.aiStrategy,
  );
  const aiRevenue =
    company.aiRevenuePct !== undefined && company.fy2024RevenueUsdM !== undefined
      ? (company.fy2024RevenueUsdM * company.aiRevenuePct) / 100
      : undefined;

  return (
    <div className="border border-[var(--border-soft)] p-3.5 flex flex-col gap-3 bg-[var(--bg-1)]/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="hud-label">OPERATOR BRIEF</div>
          <div
            className="mt-0.5 text-[13px]"
            style={{ color: "var(--fg-0)", fontWeight: 500 }}
          >
            {company.name}
          </div>
          <div className="hud-meta mt-0.5">
            {company.exchange} · {company.ticker} · HQ {company.hqCity}
          </div>
        </div>
        <span
          className="hud-label px-2 py-0.5 border whitespace-nowrap"
          style={{ color: stratColor, borderColor: stratColor }}
        >
          {stratLabel}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <BriefStat label="MKT CAP" value={formatUsd(company.marketCapUsdM)} />
        <BriefStat
          label="FY24 REV"
          value={formatUsd(company.fy2024RevenueUsdM)}
        />
        <BriefStat
          label="AI % REV"
          value={
            company.aiRevenuePct !== undefined
              ? `${company.aiRevenuePct}%`
              : "—"
          }
          accent={(company.aiRevenuePct ?? 0) >= 20 ? "cyan" : "fg"}
        />
      </div>

      {(aiRevenue !== undefined || company.hashrateEH !== undefined) && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-soft)]">
          <BriefStat
            label="AI REV (EST)"
            value={formatUsd(aiRevenue)}
            accent="cyan"
          />
          <BriefStat
            label="HASHRATE"
            value={
              company.hashrateEH !== undefined && company.hashrateEH > 0
                ? `${company.hashrateEH} EH/s`
                : "—"
            }
            accent="amber"
          />
        </div>
      )}

      {company.description && (
        <p
          className="text-[12px] leading-relaxed pt-1"
          style={{ color: "var(--fg-mute)" }}
        >
          {company.description}
        </p>
      )}

      <a
        href={company.ir_url}
        target="_blank"
        rel="noopener noreferrer"
        className="hud-meta"
        style={{ color: "var(--cyan)" }}
      >
        ↗ INVESTOR RELATIONS
      </a>
    </div>
  );
}

function BriefStat({
  label,
  value,
  accent = "fg",
}: {
  label: string;
  value: string;
  accent?: "cyan" | "amber" | "fg";
}) {
  const color =
    accent === "cyan"
      ? "var(--cyan)"
      : accent === "amber"
        ? "var(--amber)"
        : "var(--fg-0)";
  return (
    <div>
      <div className="hud-label">{label}</div>
      <div
        className="text-[15px] mt-0.5"
        style={{ color, fontWeight: 500, letterSpacing: "0.01em" }}
      >
        {value}
      </div>
    </div>
  );
}
