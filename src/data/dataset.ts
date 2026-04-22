import raw from "./dataset.json";
import { datasetSchema } from "./schema";
import type { Dataset } from "@/types";

let cached: Dataset | null = null;

export function getDataset(): Dataset {
  if (cached) return cached;
  const parsed = datasetSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[dataset] validation failed", parsed.error.format());
    throw new Error(
      "dataset.json failed schema validation — see console for details.",
    );
  }
  cached = parsed.data as Dataset;
  return cached;
}
