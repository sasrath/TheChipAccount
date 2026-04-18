import { z } from "zod";

export const ConfidenceSchema = z.enum(["high", "medium", "low", "estimated"]);

export const MetricValueSchema = z.object({
  value: z.number(),
  sourceId: z.string(),
  confidence: ConfidenceSchema,
});

export const ProcessMixItemSchema = z.object({
  processId: z.string(),
  stepCount: z.number().int().nonnegative(),
});

export const PerStepPerWaferSchema = z.object({
  waterL: MetricValueSchema,
  energyKwh: MetricValueSchema,
  ghgScope2KgCo2e: MetricValueSchema,
  pfasKgCo2e: MetricValueSchema,
});

export const ProcessFamilySchema = z.enum([
  "lithography",
  "etch",
  "deposition",
  "cmp",
  "clean",
  "implant",
  "metrology",
  "thermal",
]);

export const ProcessSchema = z.object({
  id: z.string(),
  name: z.string(),
  family: ProcessFamilySchema,
  description: z.string().optional(),
  perStepPerWafer: PerStepPerWaferSchema,
  notes: z.string().optional(),
});

export const ChipSchema = z.object({
  id: z.string(),
  name: z.string(),
  vendor: z.string(),
  nodeNm: z.number(),
  nodeFamily: z.string(),
  dieAreaMm2: z.number(),
  transistorCountBillions: z.number().optional(),
  estimatedMaskCount: z.number(),
  launchYear: z.number(),
  powers: z.string(),
  yieldAssumption: z.number().min(0).max(1),
  specSourceId: z.string().optional(),
  processMix: z.array(ProcessMixItemSchema),
  notes: z.string().optional(),
});

export const SourceTypeSchema = z.enum(["report", "paper", "dataset", "article", "official_doc"]);

export const SourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  org: z.string(),
  year: z.number(),
  authors: z.string().optional(),
  url: z.string().url(),
  accessedOn: z.string(),
  type: SourceTypeSchema,
  keyFindings: z.string().optional(),
});

export const ChipsFileSchema = z.object({
  _comment: z.string().optional(),
  _units: z.record(z.string(), z.string()).optional(),
  _wafer: z
    .object({
      diameterMm: z.number(),
      usableAreaMm2: z.number(),
      note: z.string().optional(),
    })
    .optional(),
  chips: z.array(ChipSchema),
});

export const ProcessesFileSchema = z.object({
  _comment: z.string().optional(),
  _units: z.record(z.string(), z.string()).optional(),
  _calibration: z.record(z.string(), z.string()).optional(),
  processes: z.array(ProcessSchema),
});

export const SourcesFileSchema = z.object({
  _comment: z.string().optional(),
  _accessedOn: z.string().optional(),
  sources: z.array(SourceSchema),
});
