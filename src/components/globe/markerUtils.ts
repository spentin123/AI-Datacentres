import type { DataCenter, Company, PowerSource, ViewMode } from "@/types";
import { aiGradientColor, mwToAltitude, mwToRadius } from "@/lib/derive";
import { lookupTenant, type TenantHQ } from "@/data/tenants";

export const POWER_SOURCE_COLORS: Record<PowerSource, string> = {
  hydro: "#22d3ee",
  nuclear: "#a78bfa",
  gas: "#f59e0b",
  grid: "#64748b",
  wind: "#6ee7b7",
  solar: "#facc15",
  mixed: "#e6edf3",
};

export const POWER_SOURCE_LABELS: Record<PowerSource, string> = {
  hydro: "HYDRO",
  nuclear: "NUCLEAR",
  gas: "GAS",
  grid: "GRID",
  wind: "WIND",
  solar: "SOLAR",
  mixed: "MIXED",
};

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
  viewMode: ViewMode,
  activeTickers: Set<string>,
): PointDatum[] {
  return sites
    .filter((s) => activeTickers.size === 0 || activeTickers.has(s.companyTicker))
    .map((site) => {
      const company = companiesByTicker[site.companyTicker];
      let color: string;
      if (viewMode === "company") color = company?.color ?? "#22d3ee";
      else if (viewMode === "power_source")
        color = POWER_SOURCE_COLORS[site.powerSource];
      else color = aiGradientColor(site.workload.aiHpcPct);
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

export interface ArcDatum {
  site: DataCenter;
  tenant: TenantHQ;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: [string, string];
  stroke: number;
  label: string;
}

export function buildArcs(
  sites: DataCenter[],
  activeTickers: Set<string>,
): ArcDatum[] {
  const out: ArcDatum[] = [];
  const scoped = sites.filter(
    (s) => activeTickers.size === 0 || activeTickers.has(s.companyTicker),
  );
  for (const site of scoped) {
    for (const raw of site.tenants ?? []) {
      const tenant = lookupTenant(raw);
      if (!tenant) continue;
      // Skip degenerate arcs where HQ ≈ site (avoids a dot instead of an arc).
      if (
        Math.abs(tenant.lat - site.location.lat) < 0.5 &&
        Math.abs(tenant.lng - site.location.lng) < 0.5
      )
        continue;
      out.push({
        site,
        tenant,
        startLat: site.location.lat,
        startLng: site.location.lng,
        endLat: tenant.lat,
        endLng: tenant.lng,
        color: [tenant.color, `${tenant.color}22`],
        stroke: 0.4,
        label: `${site.companyTicker} · ${site.name} → ${tenant.name}`,
      });
    }
  }
  return out;
}

export function buildRings(
  sites: DataCenter[],
  companiesByTicker: Record<string, Company>,
  activeTickers: Set<string>,
): RingDatum[] {
  const scoped = sites.filter(
    (s) => activeTickers.size === 0 || activeTickers.has(s.companyTicker),
  );
  const growth: RingDatum[] = scoped
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
  // Low-confidence sites get a slower amber "EST." halo so uncertainty
  // is visible at a glance without hovering.
  const confidence: RingDatum[] = scoped
    .filter((s) => s.confidence === "low")
    .map((site) => ({
      lat: site.location.lat,
      lng: site.location.lng,
      maxR: 1.0,
      propagationSpeed: 0.5,
      repeatPeriod: 2600,
      color: "#f59e0b",
    }));
  return [...growth, ...confidence];
}
