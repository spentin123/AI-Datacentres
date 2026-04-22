import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Typewriter } from "@/components/primitives/HUDText";
import { useAppStore } from "@/state/useAppStore";

const LINES = [
  "> INITIALIZING NODE",
  "> CONNECTING TO FINANCIAL UPLINK ... [OK]",
  "> SCANNING PUBLIC DISCLOSURES · 11 ENTITIES",
  "> GEO-LOCATING ASSETS · TRIANGULATING MW",
  "> ENGAGING VISUAL CORTEX",
];

interface Props {
  siteCount: number;
}

export function BootSequence({ siteCount }: Props) {
  const { bootComplete, setBootComplete } = useAppStore();
  const [step, setStep] = useState(0);
  const [skip, setSkip] = useState(false);

  // Query-param bypass
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("noboot")) {
      setBootComplete(true);
      return;
    }
    if (sessionStorage.getItem("aiinfra_boot_seen") === "1") {
      setBootComplete(true);
    }
  }, [setBootComplete]);

  // Skip on any key/click
  useEffect(() => {
    if (bootComplete) return;
    const done = () => {
      setSkip(true);
      setBootComplete(true);
      sessionStorage.setItem("aiinfra_boot_seen", "1");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") done();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bootComplete, setBootComplete]);

  // Advance through lines
  useEffect(() => {
    if (bootComplete) return;
    if (step < LINES.length) return; // waits for onDone to advance
    const t = setTimeout(() => {
      setBootComplete(true);
      sessionStorage.setItem("aiinfra_boot_seen", "1");
    }, 500);
    return () => clearTimeout(t);
  }, [step, bootComplete, setBootComplete]);

  return (
    <AnimatePresence>
      {!bootComplete && !skip && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] bg-[var(--bg-0)] flex items-center justify-center"
          onClick={() => {
            setSkip(true);
            setBootComplete(true);
            sessionStorage.setItem("aiinfra_boot_seen", "1");
          }}
        >
          <div className="grid-bg absolute inset-0 opacity-40" />
          <div className="relative max-w-4xl w-full px-12 font-mono crt-flicker">
            <div
              className="mb-10 text-sm md:text-base"
              style={{
                color: "var(--cyan)",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              // AI INFRA SCAN · TERMINAL v0.1
            </div>
            <div
              className="mb-8 chromatic"
              style={{
                color: "var(--fg-0)",
                fontSize: "clamp(32px, 6vw, 64px)",
                lineHeight: 1.05,
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              POWER GRID<span style={{ color: "var(--cyan)" }}> //</span> AI
              INFRASTRUCTURE MONITOR
            </div>
            <div className="flex flex-col gap-3 text-lg md:text-2xl leading-snug">
              {LINES.slice(0, step + 1).map((line, i) => {
                const isCurrent = i === step;
                const text = line
                  .replace("11 ENTITIES", "11 ENTITIES")
                  .replace(
                    "TRIANGULATING MW",
                    `TRIANGULATING ${siteCount} SITES`,
                  );
                return (
                  <div key={i}>
                    {isCurrent ? (
                      <Typewriter
                        text={text}
                        speed={14}
                        onDone={() => setStep((s) => s + 1)}
                      />
                    ) : (
                      <span style={{ color: "var(--fg-mute)" }}>{text}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div
              className="mt-12 text-sm"
              style={{
                color: "var(--fg-dim)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Press any key to skip
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
