import type { z } from "zod";
import type {
  ChipSchema,
  ProcessSchema,
  SourceSchema,
  ConfidenceSchema,
  ProcessFamilySchema,
  ProcessMixItemSchema,
  MetricValueSchema,
} from "./schemas";

export type Chip = z.infer<typeof ChipSchema>;
export type Process = z.infer<typeof ProcessSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Confidence = z.infer<typeof ConfidenceSchema>;
export type ProcessFamily = z.infer<typeof ProcessFamilySchema>;
export type ProcessMixItem = z.infer<typeof ProcessMixItemSchema>;
export type MetricValue = z.infer<typeof MetricValueSchema>;

export type MetricKey = "waterL" | "energyKwh" | "ghgKgCo2e" | "pfasKgCo2e";

export type ComputedFootprint = {
  chip: Chip;
  totals: {
    waterL: number;
    energyKwh: number;
    ghgScope2KgCo2e: number;
    pfasKgCo2e: number;
    ghgTotalKgCo2e: number;
  };
  byFamily: Record<
    string,
    {
      waterL: number;
      energyKwh: number;
      ghgScope2KgCo2e: number;
      pfasKgCo2e: number;
      ghgTotalKgCo2e: number;
    }
  >;
  perWafer: {
    waterL: number;
    energyKwh: number;
    ghgScope2KgCo2e: number;
    pfasKgCo2e: number;
    ghgTotalKgCo2e: number;
  };
  goodDiesPerWafer: number;
  totalSteps: number;
  sourceIds: string[];
};

export type ChatMessage = {
  role: "user" | "model";
  content: string;
};
