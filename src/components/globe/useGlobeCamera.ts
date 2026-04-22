import { useEffect, useRef, type MutableRefObject } from "react";
import type { DataCenter } from "@/types";

interface GlobeMethods {
  pointOfView: (pov: { lat: number; lng: number; altitude: number }, ms?: number) => void;
  controls: () => {
    autoRotate: boolean;
    autoRotateSpeed: number;
    object?: { position: { length: () => number } };
    enableZoom?: boolean;
    minDistance?: number;
    maxDistance?: number;
  };
}

export function useGlobeCamera(
  globeRef: MutableRefObject<GlobeMethods | null>,
  selectedSite: DataCenter | null,
) {
  const lastSelectedId = useRef<string | null>(null);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls();
    if (controls) {
      // Keep auto-rotate on except while a site is selected.
      // Speed is managed by the altitude-aware loop in GlobeScene.
      controls.autoRotate = !selectedSite;
    }
  }, [globeRef, selectedSite]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g || !selectedSite) return;
    if (lastSelectedId.current === selectedSite.id) return;
    lastSelectedId.current = selectedSite.id;
    g.pointOfView(
      {
        lat: selectedSite.location.lat,
        lng: selectedSite.location.lng,
        altitude: 1.6,
      },
      1200,
    );
  }, [globeRef, selectedSite]);
}
