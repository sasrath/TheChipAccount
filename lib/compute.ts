import type { Chip, ComputedFootprint } from "./types";
import {
  getProcess,
  WAFER_USABLE_AREA_MM2,
  SCRIBE_ALLOWANCE_MM2,
} from "./data";

export function computeFootprint(chip: Chip): ComputedFootprint {
  const totalsPerWafer = {
    waterL: 0,
    energyKwh: 0,
    ghgScope2KgCo2e: 0,
    pfasKgCo2e: 0,
    ghgTotalKgCo2e: 0,
  };

  const byFamilyPerWafer: Record<
    string,
    {
      waterL: number;
      energyKwh: number;
      ghgScope2KgCo2e: number;
      pfasKgCo2e: number;
      ghgTotalKgCo2e: number;
    }
  > = {};

  const sourceIds = new Set<string>();
  let totalSteps = 0;

  for (const item of chip.processMix) {
    const process = getProcess(item.processId);
    if (!process) continue;

    const n = item.stepCount;
    totalSteps += n;

    const s = process.perStepPerWafer;
    const water = s.waterL.value * n;
    const energy = s.energyKwh.value * n;
    const ghgS2 = s.ghgScope2KgCo2e.value * n;
    const pfas = s.pfasKgCo2e.value * n;
    const ghgTotal = ghgS2 + pfas;

    totalsPerWafer.waterL += water;
    totalsPerWafer.energyKwh += energy;
    totalsPerWafer.ghgScope2KgCo2e += ghgS2;
    totalsPerWafer.pfasKgCo2e += pfas;

    // Track by family
    const fam = process.family;
    if (!byFamilyPerWafer[fam]) {
      byFamilyPerWafer[fam] = {
        waterL: 0,
        energyKwh: 0,
        ghgScope2KgCo2e: 0,
        pfasKgCo2e: 0,
        ghgTotalKgCo2e: 0,
      };
    }
    byFamilyPerWafer[fam].waterL += water;
    byFamilyPerWafer[fam].energyKwh += energy;
    byFamilyPerWafer[fam].ghgScope2KgCo2e += ghgS2;
    byFamilyPerWafer[fam].pfasKgCo2e += pfas;
    byFamilyPerWafer[fam].ghgTotalKgCo2e += ghgTotal;

    // Collect source IDs
    sourceIds.add(s.waterL.sourceId);
    sourceIds.add(s.energyKwh.sourceId);
    sourceIds.add(s.ghgScope2KgCo2e.sourceId);
    sourceIds.add(s.pfasKgCo2e.sourceId);
  }

  totalsPerWafer.ghgTotalKgCo2e =
    totalsPerWafer.ghgScope2KgCo2e + totalsPerWafer.pfasKgCo2e;

  // Per-wafer to per-die amortization
  const candidateDies =
    WAFER_USABLE_AREA_MM2 / (chip.dieAreaMm2 + SCRIBE_ALLOWANCE_MM2);
  const goodDiesPerWafer = candidateDies * chip.yieldAssumption;

  const scale = (v: number) => v / goodDiesPerWafer;

  const totals = {
    waterL: scale(totalsPerWafer.waterL),
    energyKwh: scale(totalsPerWafer.energyKwh),
    ghgScope2KgCo2e: scale(totalsPerWafer.ghgScope2KgCo2e),
    pfasKgCo2e: scale(totalsPerWafer.pfasKgCo2e),
    ghgTotalKgCo2e: scale(totalsPerWafer.ghgTotalKgCo2e),
  };

  const byFamily: ComputedFootprint["byFamily"] = {};
  for (const [fam, vals] of Object.entries(byFamilyPerWafer)) {
    byFamily[fam] = {
      waterL: scale(vals.waterL),
      energyKwh: scale(vals.energyKwh),
      ghgScope2KgCo2e: scale(vals.ghgScope2KgCo2e),
      pfasKgCo2e: scale(vals.pfasKgCo2e),
      ghgTotalKgCo2e: scale(vals.ghgTotalKgCo2e),
    };
  }

  return {
    chip,
    totals,
    byFamily,
    perWafer: totalsPerWafer,
    goodDiesPerWafer,
    totalSteps,
    sourceIds: [...sourceIds],
  };
}
