#!/usr/bin/env tsx
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { datasetSchema } from "../src/data/schema";

const here = path.dirname(fileURLToPath(import.meta.url));
const datasetPath = path.resolve(here, "../src/data/dataset.json");

const raw = JSON.parse(readFileSync(datasetPath, "utf-8"));
const parsed = datasetSchema.safeParse(raw);

if (!parsed.success) {
  console.error("✗ dataset.json failed validation:\n");
  for (const issue of parsed.error.issues) {
    console.error(`  [${issue.path.join(".")}] ${issue.message}`);
  }
  process.exit(1);
}

const ds = parsed.data;
if (!ds) {
  console.error("✗ no dataset parsed");
  process.exit(1);
}
const tickers = new Set(ds.companies.map((c) => c.ticker));
const sitesByTicker: Record<string, number> = {};
for (const s of ds.sites) {
  sitesByTicker[s.companyTicker] = (sitesByTicker[s.companyTicker] ?? 0) + 1;
}

console.log(`✓ dataset.json OK`);
console.log(`  ${ds.companies.length} companies · ${ds.sites.length} sites`);
console.log(`  schemaVersion ${ds.schemaVersion} · lastUpdated ${ds.lastUpdated}`);

const missing = [...tickers].filter((t) => !sitesByTicker[t]);
if (missing.length) {
  console.warn(`  ⚠ companies with no sites yet: ${missing.join(", ")}`);
}

const low = ds.sites.filter((s) => s.confidence === "low").length;
const med = ds.sites.filter((s) => s.confidence === "medium").length;
const high = ds.sites.filter((s) => s.confidence === "high").length;
console.log(`  confidence: ${high} high · ${med} medium · ${low} low`);
