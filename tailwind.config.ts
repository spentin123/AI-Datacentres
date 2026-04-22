import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          0: "var(--bg-0)",
          1: "var(--bg-1)",
          2: "var(--bg-2)",
        },
        fg: {
          DEFAULT: "var(--fg-0)",
          mute: "var(--fg-mute)",
          dim: "var(--fg-dim)",
        },
        amber: {
          DEFAULT: "var(--amber)",
          glow: "var(--amber-glow)",
        },
        cyan: {
          DEFAULT: "var(--cyan)",
          glow: "var(--cyan-glow)",
        },
        danger: "var(--danger)",
        ok: "var(--ok)",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "IBM Plex Mono", "ui-monospace", "monospace"],
        display: ["IBM Plex Mono", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "cyan-glow": "0 0 12px rgba(34, 211, 238, 0.35)",
        "amber-glow": "0 0 12px rgba(245, 158, 11, 0.35)",
        "panel": "0 0 0 1px rgba(34,211,238,0.25), 0 8px 40px rgba(0,0,0,0.6)",
      },
      animation: {
        "crt-flicker": "crt-flicker 7s infinite",
        "reticle-spin": "reticle-spin 8s linear infinite",
        "pulse-soft": "pulse-soft 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
