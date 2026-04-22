export type PowerSource =
  | "hydro"
  | "nuclear"
  | "gas"
  | "grid"
  | "wind"
  | "solar"
  | "mixed";

export type SiteStatus =
  | "operational"
  | "under_construction"
  | "planned"
  | "announced"
  | "decommissioned";

export type AiStrategy = "pureplay_ai" | "hybrid" | "exploring";
export type Confidence = "high" | "medium" | "low";
export type Exchange = "NASDAQ" | "NYSE" | "OTC" | "ASX" | "TSX";
export type ViewMode = "company" | "ai_allocation";

export interface WorkloadMix {
  btcMiningPct: number;
  aiHpcPct: number;
  otherPct?: number;
}

export interface Capacity {
  currentMW: number;
  plannedMW?: number;
  finalTargetMW?: number;
}

export interface Location {
  lat: number;
  lng: number;
  city?: string;
  region: string;
  country: string;
}

export interface Source {
  label: string;
  url: string;
  date: string;
}

export interface DataCenter {
  id: string;
  companyTicker: string;
  name: string;
  location: Location;
  capacity: Capacity;
  workload: WorkloadMix;
  powerSource: PowerSource;
  powerSourceDetail?: string;
  status: SiteStatus;
  commissioned?: string;
  tenants?: string[];
  notes?: string;
  sources: Source[];
  confidence: Confidence;
}

export interface Company {
  ticker: string;
  name: string;
  exchange: Exchange;
  color: string;
  hqCity: string;
  hqCountry: string;
  aiStrategy: AiStrategy;
  marketCapUsdM?: number;
  fy2024RevenueUsdM?: number;
  aiRevenuePct?: number;
  hashrateEH?: number;
  description?: string;
  ir_url: string;
}

export interface Dataset {
  companies: Company[];
  sites: DataCenter[];
  lastUpdated: string;
  schemaVersion: 1;
}
