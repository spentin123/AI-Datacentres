import type { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  accent?: "cyan" | "amber" | "fg";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const accentMap = {
  cyan: "var(--cyan)",
  amber: "var(--amber)",
  fg: "var(--fg-0)",
};

const sizeMap = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
};

export function MetricReadout({
  label,
  value,
  unit,
  delta,
  deltaTone = "neutral",
  accent = "fg",
  size = "md",
  className = "",
}: Props) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="hud-label">{label}</div>
      <div className="flex items-baseline gap-2">
        <div
          className={`hud-value chromatic ${sizeMap[size]}`}
          style={{ color: accentMap[accent] }}
        >
          {value}
        </div>
        {unit && <div className="hud-meta">{unit}</div>}
      </div>
      {delta && (
        <div
          className="hud-meta flex items-center gap-1"
          style={{
            color:
              deltaTone === "up"
                ? "var(--ok)"
                : deltaTone === "down"
                  ? "var(--danger)"
                  : "var(--fg-mute)",
          }}
        >
          {deltaTone === "up" && "▲"}
          {deltaTone === "down" && "▼"}
          {deltaTone === "neutral" && "·"} {delta}
        </div>
      )}
    </div>
  );
}
