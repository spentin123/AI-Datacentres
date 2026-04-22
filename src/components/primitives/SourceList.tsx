import type { Source } from "@/types";
import { ExternalLink } from "lucide-react";

export function SourceList({ sources }: { sources: Source[] }) {
  if (!sources?.length) return null;
  return (
    <div className="mt-4">
      <div className="hud-label mb-2">EVIDENCE</div>
      <ol className="flex flex-col gap-1.5">
        {sources.map((s, i) => (
          <li
            key={`${s.url}-${i}`}
            className="flex items-start gap-2 text-[11px] leading-snug"
          >
            <span
              className="font-mono shrink-0 w-5 text-right"
              style={{ color: "var(--cyan)" }}
            >
              [{i + 1}]
            </span>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-start gap-1.5 hover:underline min-w-0"
            >
              <span className="truncate">{s.label}</span>
              <ExternalLink
                size={11}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--fg-mute)" }}
              />
            </a>
            <span
              className="shrink-0 ml-auto"
              style={{ color: "var(--fg-dim)" }}
            >
              {s.date}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
