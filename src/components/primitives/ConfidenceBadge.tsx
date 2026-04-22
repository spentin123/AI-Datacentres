import type { Confidence } from "@/types";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function ConfidenceBadge({ level }: { level: Confidence }) {
  if (level === "high") {
    return (
      <div
        className="inline-flex items-center gap-1 hud-label"
        style={{ color: "var(--ok)" }}
      >
        <CheckCircle2 size={10} /> VERIFIED
      </div>
    );
  }
  return (
    <div
      className="inline-flex items-center gap-1 hud-label"
      style={{ color: level === "medium" ? "var(--amber)" : "var(--danger)" }}
    >
      <AlertTriangle size={10} /> {level === "medium" ? "EST." : "UNVERIFIED"}
    </div>
  );
}
