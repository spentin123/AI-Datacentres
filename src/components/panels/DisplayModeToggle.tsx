import { motion } from "framer-motion";
import { useAppStore, type DisplayMode } from "@/state/useAppStore";

const options: { value: DisplayMode; label: string }[] = [
  { value: "globe", label: "GLOBE" },
  { value: "matrix", label: "MATRIX" },
  { value: "timeline", label: "TIMELINE" },
];

export function DisplayModeToggle() {
  const { displayMode, setDisplayMode } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.25 }}
      className="flex items-center gap-2"
    >
      <span className="hud-label" style={{ color: "var(--fg-mute)" }}>
        VIEW
      </span>
      <div className="flex border border-[var(--border-soft)]">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => setDisplayMode(o.value)}
            className={`px-3 py-1 hud-label transition-all ${
              displayMode === o.value
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
