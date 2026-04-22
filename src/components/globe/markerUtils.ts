import type { DataCenter, Company } from "@/types";
import { aiGradientColor, mwToAltitude, mwToRadius } from "@/lib/derive";

export interface PointDatum {
  site: DataCenter;
  lat: number;
  lng: number;
  altitude: number;
  radius: number;
  color: string;
}

export function buildPoints(
  sites: DataCenter[],
  companiesByTicker: Record<string, Company>,
  viewMode: "company" | "ai_allocation",
  activeTickers: Set<string>,
): PointDatum[] {
  return sites
    .filter((s) => activeTickers.size === 0 || activeTickers.has(s.companyTicker))
    .map((site) => {
      const company = companiesByTicker[site.companyTicker];
      const color =
        viewMode === "company"
          ? (company?.color ?? "#22d3ee")
          : aiGradientColor(site.workload.aiHpcPct);
      return {
        site,
        lat: site.location.lat,
        lng: site.location.lng,
        altitude: mwToAltitude(site.capacity.currentMW),
        radius: mwToRadius(site.capacity.currentMW),
        color,
      };
    });
}

export interface RingDatum {
  lat: number;
  lng: number;
  maxR: number;
  propagationSpeed: number;
  repeatPeriod: number;
  color: string;
}

export function buildRings(
  sites: DataCenter[],
  companiesByTicker: Record<string, Company>,
  activeTickers: Set<string>,
): RingDatum[] {
  return sites
    .filter((s) => activeTickers.size === 0 || activeTickers.has(s.companyTicker))
    .filter(
      (s) =>
        (s.capacity.plannedMW && s.capacity.plannedMW > 0) ||
        s.status === "under_construction" ||
        s.status === "planned",
    )
    .map((site) => {
      const company = companiesByTicker[site.companyTicker];
      const plannedBoost = (site.capacity.plannedMW ?? 0) / 400;
      return {
        lat: site.location.lat,
        lng: site.location.lng,
        maxR: Math.min(5, 1.2 + plannedBoost),
        propagationSpeed: 1.2,
        repeatPeriod: 2200,
        color: company?.color ?? "#22d3ee",
      };
    });
}
