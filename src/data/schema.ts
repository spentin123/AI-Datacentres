import { z } from "zod";

export const powerSourceSchema = z.enum([
  "hydro",
  "nuclear",
  "gas",
  "grid",
  "wind",
  "solar",
  "mixed",
]);

export const siteStatusSchema = z.enum([
  "operational",
  "under_construction",
  "planned",
  "announced",
  "decommissioned",
]);

export const exchangeSchema = z.enum(["NASDAQ", "NYSE", "OTC", "ASX", "TSX"]);
export const aiStrategySchema = z.enum(["pureplay_ai", "hybrid", "exploring"]);
export const confidenceSchema = z.enum(["high", "medium", "low"]);

export const sourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  date: z.string().min(4),
});

export const workloadSchema = z
  .object({
    btcMiningPct: z.number().min(0).max(100),
    aiHpcPct: z.number().min(0).max(100),
    otherPct: z.number().min(0).max(100).optional(),
  })
  .refine(
    (w) => {
      const sum = w.btcMiningPct + w.aiHpcPct + (w.otherPct ?? 0);
      return Math.abs(sum - 100) < 0.01;
    },
    { message: "workload percentages must sum to 100" },
  );

export const capacitySchema = z.object({
  currentMW: z.number().min(0),
  plannedMW: z.number().min(0).optional(),
  finalTargetMW: z.number().min(0).optional(),
});

export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  city: z.string().optional(),
  region: z.string(),
  country: z.string(),
});

export const dataCenterSchema = z.object({
  id: z.string().min(1),
  companyTicker: z.string().min(1),
  name: z.string().min(1),
  location: locationSchema,
  capacity: capacitySchema,
  workload: workloadSchema,
  powerSource: powerSourceSchema,
  powerSourceDetail: z.string().optional(),
  status: siteStatusSchema,
  commissioned: z.string().optional(),
  tenants: z.array(z.string()).optional(),
  notes: z.string().optional(),
  sources: z.array(sourceSchema).min(1, "every site must cite ≥1 source"),
  confidence: confidenceSchema,
});

export const companySchema = z.object({
  ticker: z.string().min(1),
  name: z.string().min(1),
  exchange: exchangeSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  hqCity: z.string(),
  hqCountry: z.string(),
  aiStrategy: aiStrategySchema,
  marketCapUsdM: z.number().optional(),
  fy2024RevenueUsdM: z.number().optional(),
  aiRevenuePct: z.number().min(0).max(100).optional(),
  hashrateEH: z.number().min(0).optional(),
  description: z.string().optional(),
  ir_url: z.string().url(),
});

export const datasetSchema = z
  .object({
    companies: z.array(companySchema).min(1),
    sites: z.array(dataCenterSchema),
    lastUpdated: z.string(),
    schemaVersion: z.literal(1),
  })
  .superRefine((ds, ctx) => {
    const tickers = new Set(ds.companies.map((c) => c.ticker));
    ds.sites.forEach((s, i) => {
      if (!tickers.has(s.companyTicker)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sites", i, "companyTicker"],
          message: `site "${s.id}" references unknown ticker "${s.companyTicker}"`,
        });
      }
    });
  });

export type DatasetParsed = z.infer<typeof datasetSchema>;
