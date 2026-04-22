import { useMemo, useRef, useState, useEffect } from "react";
import Globe from "react-globe.gl";
import type { Dataset, DataCenter } from "@/types";
import { useAppStore } from "@/state/useAppStore";
import { buildPoints, buildRings, type PointDatum } from "./markerUtils";
import { companyByTicker, countryCentroid } from "@/lib/derive";
import { useGlobeCamera } from "./useGlobeCamera";
import { formatMW, formatPct } from "@/lib/format";

interface Props {
  dataset: Dataset;
}

export function GlobeScene({ dataset }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const {
    selectedSiteId,
    setSelectedSiteId,
    setHoveredSiteId,
    viewMode,
    activeTickers,
    statusFilters,
    selectedCountry,
  } = useAppStore();

  const compByTicker = useMemo(
    () => companyByTicker(dataset.companies),
    [dataset.companies],
  );

  const visibleSites = useMemo(
    () =>
      dataset.sites
        .filter((s) => statusFilters.has(s.status))
        .filter(
          (s) => !selectedCountry || s.location.country === selectedCountry,
        ),
    [dataset.sites, statusFilters, selectedCountry],
  );

  const points = useMemo(
    () => buildPoints(visibleSites, compByTicker, viewMode, activeTickers),
    [visibleSites, compByTicker, viewMode, activeTickers],
  );

  const rings = useMemo(
    () => buildRings(visibleSites, compByTicker, activeTickers),
    [visibleSites, compByTicker, activeTickers],
  );

  const selectedSite: DataCenter | null = useMemo(
    () =>
      selectedSiteId
        ? dataset.sites.find((s) => s.id === selectedSiteId) ?? null
        : null,
    [selectedSiteId, dataset.sites],
  );

  useGlobeCamera(globeRef, selectedSite);

  // Fly to country centroid when a country is selected
  useEffect(() => {
    const g = globeRef.current;
    if (!g || !selectedCountry || selectedSite) return;
    const countrySites = dataset.sites.filter(
      (s) => s.location.country === selectedCountry,
    );
    if (countrySites.length === 0) return;
    const { lat, lng } = countryCentroid(countrySites);
    const altitude = countrySites.length > 3 ? 1.3 : 1.0;
    g.pointOfView({ lat, lng, altitude }, 1400);
  }, [selectedCountry, selectedSite, dataset.sites]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () =>
      setDims({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Initial camera + altitude-aware rotation speed loop
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    g.pointOfView({ lat: 35, lng: -80, altitude: 2.4 });
    const c = g.controls();
    if (!c) return;
    c.autoRotate = true;
    c.autoRotateSpeed = 0.18;
    c.enableZoom = true;
    c.minDistance = 180;
    c.maxDistance = 600;

    // Rotation speed scales with camera altitude: slow when zoomed in,
    // faster when zoomed out. Camera distance range ~180 (close) → 600 (far).
    let raf = 0;
    const loop = () => {
      const pos = c.object?.position;
      if (pos && typeof pos.length === "function") {
        const dist = pos.length();
        const t = Math.max(0, Math.min(1, (dist - 180) / (600 - 180)));
        c.autoRotateSpeed = 0.04 + t * 0.28;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <Globe
        ref={globeRef}
        width={dims.w}
        height={dims.h}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere
        atmosphereColor="#22d3ee"
        atmosphereAltitude={0.22}
        pointsData={points}
        pointLat={(d: object) => (d as PointDatum).lat}
        pointLng={(d: object) => (d as PointDatum).lng}
        pointAltitude={(d: object) => (d as PointDatum).altitude}
        pointRadius={(d: object) => (d as PointDatum).radius}
        pointColor={(d: object) => (d as PointDatum).color}
        pointResolution={16}
        pointLabel={(d: object) => {
          const p = d as PointDatum;
          const s = p.site;
          return `
            <div style="background:rgba(10,14,20,0.92);border:1px solid rgba(34,211,238,0.45);padding:8px 10px;font-family:'JetBrains Mono',monospace;color:#e6edf3;min-width:180px">
              <div style="font-size:10px;letter-spacing:0.14em;color:#22d3ee;text-transform:uppercase">${s.companyTicker} · ${s.location.region}</div>
              <div style="font-size:13px;margin-top:2px;font-weight:500">${s.name}</div>
              <div style="display:flex;gap:10px;margin-top:6px;font-size:11px;color:#7d8996">
                <span><span style="color:#f59e0b">${formatMW(s.capacity.currentMW)}</span></span>
                <span>AI <span style="color:#22d3ee">${formatPct(s.workload.aiHpcPct)}</span></span>
              </div>
            </div>
          `;
        }}
        onPointClick={(d: object) => {
          setSelectedSiteId((d as PointDatum).site.id);
        }}
        onPointHover={(d: object | null) => {
          setHoveredSiteId(d ? (d as PointDatum).site.id : null);
          if (containerRef.current) {
            containerRef.current.style.cursor = d ? "pointer" : "grab";
          }
        }}
        ringsData={rings}
        ringLat={(d: object) => (d as { lat: number }).lat}
        ringLng={(d: object) => (d as { lng: number }).lng}
        ringMaxRadius={(d: object) => (d as { maxR: number }).maxR}
        ringPropagationSpeed={(d: object) => (d as { propagationSpeed: number }).propagationSpeed}
        ringRepeatPeriod={(d: object) => (d as { repeatPeriod: number }).repeatPeriod}
        ringColor={(d: object) => {
          const c = (d as { color: string }).color;
          return (t: number) => {
            const alpha = Math.max(0, 0.9 * (1 - t));
            return hexToRgba(c, alpha);
          };
        }}
        ringAltitude={0.006}
      />
    </div>
  );
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const bigint = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${a})`;
}
