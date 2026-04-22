import { useEffect, useRef, type MutableRefObject } from "react";
import type { DataCenter } from "@/types";
import { useAppStore } from "@/state/useAppStore";
import { mwToAltitude } from "@/lib/derive";
import { formatMW, formatPct } from "@/lib/format";

interface GlobeLike {
  getScreenCoords?: (
    lat: number,
    lng: number,
    altitude: number,
  ) => { x: number; y: number } | null | undefined;
}

interface Props {
  globeRef: MutableRefObject<GlobeLike | null>;
  sites: DataCenter[];
}

export function HoverReticle({ globeRef, sites }: Props) {
  const hoveredSiteId = useAppStore((s) => s.hoveredSiteId);
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const rootRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hide while a site is selected (panel open) or no hover
    const site =
      !hoveredSiteId || hoveredSiteId === selectedSiteId
        ? null
        : sites.find((s) => s.id === hoveredSiteId) ?? null;
    const root = rootRef.current;
    if (!root) return;
    if (!site) {
      root.style.opacity = "0";
      return;
    }
    root.style.opacity = "1";
    const alt = mwToAltitude(site.capacity.currentMW);
    let raf = 0;
    const loop = () => {
      const g = globeRef.current;
      const p = g?.getScreenCoords?.(site.location.lat, site.location.lng, alt);
      if (
        p &&
        Number.isFinite(p.x) &&
        Number.isFinite(p.y) &&
        p.x > -500 &&
        p.y > -500
      ) {
        root.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
        root.style.visibility = "visible";
      } else {
        root.style.visibility = "hidden";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [hoveredSiteId, selectedSiteId, sites, globeRef]);

  const site =
    !hoveredSiteId || hoveredSiteId === selectedSiteId
      ? null
      : sites.find((s) => s.id === hoveredSiteId) ?? null;

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute top-0 left-0 z-20"
      style={{
        opacity: 0,
        transition: "opacity 120ms ease-out",
      }}
    >
      <div
        className="absolute"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          style={{ display: "block", overflow: "visible" }}
        >
          {/* Rotating dashed ring */}
          <g
            style={{
              transformOrigin: "48px 48px",
              animation: "reticle-spin 8s linear infinite",
            }}
          >
            <circle
              cx="48"
              cy="48"
              r="32"
              fill="none"
              stroke="var(--cyan)"
              strokeWidth="1"
              strokeDasharray="4 6"
              opacity="0.9"
            />
          </g>
          {/* Static outer faint ring */}
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="var(--cyan)"
            strokeWidth="0.5"
            opacity="0.3"
          />
          {/* Crosshair */}
          <line
            x1="48"
            y1="8"
            x2="48"
            y2="26"
            stroke="var(--cyan)"
            strokeWidth="1"
            opacity="0.9"
          />
          <line
            x1="48"
            y1="70"
            x2="48"
            y2="88"
            stroke="var(--cyan)"
            strokeWidth="1"
            opacity="0.9"
          />
          <line
            x1="8"
            y1="48"
            x2="26"
            y2="48"
            stroke="var(--cyan)"
            strokeWidth="1"
            opacity="0.9"
          />
          <line
            x1="70"
            y1="48"
            x2="88"
            y2="48"
            stroke="var(--cyan)"
            strokeWidth="1"
            opacity="0.9"
          />
          {/* Centre dot */}
          <circle cx="48" cy="48" r="1.8" fill="var(--cyan)" />
          {/* Corner brackets (POI flair) */}
          {[
            [14, 14, 1, 1],
            [82, 14, -1, 1],
            [14, 82, 1, -1],
            [82, 82, -1, -1],
          ].map(([x, y, dx, dy], i) => (
            <g key={i}>
              <line
                x1={x}
                y1={y}
                x2={x + dx * 6}
                y2={y}
                stroke="var(--cyan-glow)"
                strokeWidth="1"
              />
              <line
                x1={x}
                y1={y}
                x2={x}
                y2={y + dy * 6}
                stroke="var(--cyan-glow)"
                strokeWidth="1"
              />
            </g>
          ))}
        </svg>
        {/* Guide-out chip */}
        {site && (
          <div
            ref={chipRef}
            className="absolute font-mono"
            style={{
              left: 60,
              top: -40,
              whiteSpace: "nowrap",
              fontSize: 10,
              color: "var(--fg-0)",
            }}
          >
            <svg
              width="52"
              height="40"
              style={{
                position: "absolute",
                left: -52,
                top: 36,
                overflow: "visible",
              }}
            >
              <line
                x1="0"
                y1="40"
                x2="40"
                y2="0"
                stroke="var(--cyan)"
                strokeWidth="0.75"
                opacity="0.7"
                strokeDasharray="2 3"
              />
            </svg>
            <div
              style={{
                background: "rgba(10,14,20,0.9)",
                border: "1px solid rgba(34,211,238,0.45)",
                padding: "4px 7px",
                letterSpacing: "0.1em",
                lineHeight: 1.35,
              }}
            >
              <div style={{ color: "var(--cyan)", fontSize: 9 }}>
                TGT · {site.companyTicker}
              </div>
              <div style={{ fontSize: 11, marginTop: 1 }}>
                {site.name.toUpperCase()}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 2,
                  color: "var(--fg-mute)",
                }}
              >
                <span style={{ color: "var(--amber)" }}>
                  {formatMW(site.capacity.currentMW)}
                </span>
                <span>AI {formatPct(site.workload.aiHpcPct)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
