import { motion } from "framer-motion";
import { useAppStore } from "@/state/useAppStore";
import type { ViewMode } from "@/types";

const options: { value: ViewMode; label: string }[] = [
  { value: "ai_allocation", label: "AI ALLOCATION" },
  { value: "company", label: "COMPANY" },
];

export function ViewModeToggle() {
  const { viewMode, setViewMode } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3 }}
      className="flex items-center gap-2"
    >
      <span className="hud-label" style={{ color: "var(--fg-mute)" }}>
        COLOR BY
      </span>
      <div className="flex border border-[var(--border-soft)]">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => setViewMode(o.value)}
            className={`px-3 py-1 hud-label transition-all ${
              viewMode === o.value
                ? "bg-[var(--cyan)]/10 text-[var(--cyan)]"
                : "text-[var(--fg-mute)] hover:text-[var(--fg-0)]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
