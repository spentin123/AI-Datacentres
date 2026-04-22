export interface TenantHQ {
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  color: string;
}

// HQ coordinates for AI/HPC tenants renting capacity from the mining operators.
// Keyed by lowercased normalised tenant name (see normalizeTenant()).
export const TENANT_HQ: Record<string, TenantHQ> = {
  coreweave: {
    name: "CoreWeave",
    city: "Roseland, NJ",
    country: "USA",
    lat: 40.82,
    lng: -74.29,
    color: "#e879f9",
  },
  microsoft: {
    name: "Microsoft",
    city: "Redmond, WA",
    country: "USA",
    lat: 47.67,
    lng: -122.12,
    color: "#38bdf8",
  },
  core42: {
    name: "Core42 (G42)",
    city: "Abu Dhabi",
    country: "UAE",
    lat: 24.45,
    lng: 54.38,
    color: "#fbbf24",
  },
  fluidstack: {
    name: "Fluidstack",
    city: "New York, NY",
    country: "USA",
    lat: 40.71,
    lng: -74.01,
    color: "#a3e635",
  },
  "zero two": {
    name: "Zero Two",
    city: "Abu Dhabi",
    country: "UAE",
    lat: 24.48,
    lng: 54.35,
    color: "#c084fc",
  },
};

// Strip parenthetical modifiers and lower-case. Drops entries that are
// hardware SKUs or internal-company notes ("NVIDIA H200", "MARA (hosting)").
export function normalizeTenant(raw: string): string | null {
  const base = raw.split("(")[0].trim().toLowerCase();
  if (!base) return null;
  // Known non-tenant noise in the dataset.
  if (base === "nvidia h200" || base === "mara") return null;
  return base;
}

export function lookupTenant(raw: string): TenantHQ | null {
  const key = normalizeTenant(raw);
  if (!key) return null;
  return TENANT_HQ[key] ?? null;
}
