import type { ReactNode } from "react";
import { CornerBrackets } from "./CornerBrackets";

interface Props {
  children: ReactNode;
  title?: string;
  meta?: string;
  className?: string;
  padding?: "sm" | "md" | "lg";
  bracketSize?: number;
  accent?: "cyan" | "amber" | "danger";
}

const padMap = { sm: "p-3", md: "p-4", lg: "p-6" };
const accentMap = {
  cyan: "var(--cyan)",
  amber: "var(--amber)",
  danger: "var(--danger)",
};

export function HUDFrame({
  children,
  title,
  meta,
  className = "",
  padding = "md",
  bracketSize = 12,
  accent = "cyan",
}: Props) {
  return (
    <div className={`relative glass ${padMap[padding]} ${className}`}>
      <CornerBrackets size={bracketSize} color={accentMap[accent]} inset={-1} />
      {(title || meta) && (
        <div className="flex items-center justify-between mb-3">
          {title && (
            <div className="hud-label" style={{ color: accentMap[accent] }}>
              {title}
            </div>
          )}
          {meta && <div className="hud-meta">{meta}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
