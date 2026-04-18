/**
 * tests/compute.test.ts
 * Tests lib/compute.ts — the core footprint calculation engine.
 * Validates that computed results are physically sensible and match
 * calibration anchors within acceptable tolerances.
 */

import { computeFootprint } from "@/lib/compute";
import { getChip, listChips } from "@/lib/data";

// ── basic shape ───────────────────────────────────────────────────────────────

describe("computeFootprint — output shape", () => {
  const chips = listChips();

  test("returns all required fields", () => {
    const chip = chips[0];
    const fp = computeFootprint(chip);

    expect(fp).toHaveProperty("chip");
    expect(fp).toHaveProperty("totals");
    expect(fp).toHaveProperty("byFamily");
    expect(fp).toHaveProperty("perWafer");
    expect(fp).toHaveProperty("goodDiesPerWafer");
    expect(fp).toHaveProperty("totalSteps");
    expect(fp).toHaveProperty("sourceIds");
  });

  test("totals contain all four metrics plus ghgTotal", () => {
    const fp = computeFootprint(chips[0]);
    const keys = ["waterL", "energyKwh", "ghgScope2KgCo2e", "pfasKgCo2e", "ghgTotalKgCo2e"];
    for (const k of keys) expect(fp.totals).toHaveProperty(k);
  });

  test("ghgTotalKgCo2e = ghgScope2 + pfas (totals)", () => {
    for (const chip of chips) {
      const fp = computeFootprint(chip);
      expect(fp.totals.ghgTotalKgCo2e).toBeCloseTo(
        fp.totals.ghgScope2KgCo2e + fp.totals.pfasKgCo2e,
        6
      );
    }
  });
});

// ── sanity ranges ─────────────────────────────────────────────────────────────

describe("computeFootprint — sanity ranges (per-die)", () => {
  const chips = listChips().filter((c) => !c.id.startsWith("ref-"));

  test("all per-die metrics are positive", () => {
    for (const chip of chips) {
      const { totals } = computeFootprint(chip);
      expect(totals.waterL).toBeGreaterThan(0);
      expect(totals.energyKwh).toBeGreaterThan(0);
      expect(totals.ghgTotalKgCo2e).toBeGreaterThan(0);
      expect(totals.pfasKgCo2e).toBeGreaterThan(0);
    }
  });

  test("goodDiesPerWafer is positive for all chips", () => {
    for (const chip of chips) {
      const { goodDiesPerWafer } = computeFootprint(chip);
      expect(goodDiesPerWafer).toBeGreaterThan(0);
    }
  });

  test("totalSteps is positive for all chips", () => {
    for (const chip of chips) {
      expect(computeFootprint(chip).totalSteps).toBeGreaterThan(0);
    }
  });

  test("per-die water is less than per-wafer water", () => {
    for (const chip of chips) {
      const fp = computeFootprint(chip);
      // At least 1 die per wafer → per-die ≤ per-wafer
      expect(fp.totals.waterL).toBeLessThanOrEqual(fp.perWafer.waterL + 0.001);
    }
  });

  test("sourceIds is non-empty", () => {
    for (const chip of chips) {
      const fp = computeFootprint(chip);
      expect(fp.sourceIds.length).toBeGreaterThan(0);
    }
  });
});

// ── IMEC calibration anchors ─────────────────────────────────────────────────

describe("computeFootprint — IMEC calibration (ref-n2, ref-n28)", () => {
  const n2 = getChip("ref-n2");
  const n28 = getChip("ref-n28");

  test("ref-n2 and ref-n28 exist in chips.json", () => {
    expect(n2).toBeDefined();
    expect(n28).toBeDefined();
  });

  test("N2 per-wafer GHG within ±20% of IMEC 1,600 kg CO2e target", () => {
    const fp = computeFootprint(n2!);
    const ghgPerWafer = fp.perWafer.ghgTotalKgCo2e;
    expect(ghgPerWafer).toBeGreaterThan(1280); // -20%
    expect(ghgPerWafer).toBeLessThan(1920);    // +20%
  });

  test("N2 per-wafer water within ±20% of Hu2023 5,750 L target", () => {
    const fp = computeFootprint(n2!);
    expect(fp.perWafer.waterL).toBeGreaterThan(4600);
    expect(fp.perWafer.waterL).toBeLessThan(6900);
  });

  test("N28→N2 water scaling 1.8–3.0x (Bardon2020 target 2.3x)", () => {
    const w2 = computeFootprint(n2!).perWafer.waterL;
    const w28 = computeFootprint(n28!).perWafer.waterL;
    const ratio = w2 / w28;
    expect(ratio).toBeGreaterThan(1.8);
    expect(ratio).toBeLessThan(3.0);
  });

  test("N28→N2 energy scaling 2.0–5.0x (Bardon2020 target 3.46x)", () => {
    const e2 = computeFootprint(n2!).perWafer.energyKwh;
    const e28 = computeFootprint(n28!).perWafer.energyKwh;
    const ratio = e2 / e28;
    expect(ratio).toBeGreaterThan(2.0);
    expect(ratio).toBeLessThan(5.0);
  });

  test("N28→N2 GHG scaling 1.8–4.0x (Bardon2020 target 2.5x)", () => {
    const g2 = computeFootprint(n2!).perWafer.ghgTotalKgCo2e;
    const g28 = computeFootprint(n28!).perWafer.ghgTotalKgCo2e;
    const ratio = g2 / g28;
    expect(ratio).toBeGreaterThan(1.8);
    expect(ratio).toBeLessThan(4.0);
  });

  test("N2 Scope-2 share of total GHG is 40–80% (IMEC target ~60%)", () => {
    const fp = computeFootprint(n2!);
    const share = fp.perWafer.ghgScope2KgCo2e / fp.perWafer.ghgTotalKgCo2e;
    expect(share).toBeGreaterThan(0.4);
    expect(share).toBeLessThan(0.8);
  });
});

// ── byFamily breakdown ────────────────────────────────────────────────────────

describe("computeFootprint — byFamily breakdown", () => {
  test("byFamily metrics sum ≤ perWafer totals (rounding noise allowed)", () => {
    const chips = listChips();
    for (const chip of chips) {
      const fp = computeFootprint(chip);
      const famSumWater = Object.values(fp.byFamily).reduce(
        (acc, v) => acc + v.waterL,
        0
      );
      // byFamily values are per-die (already scaled). Sum should equal totals.waterL.
      expect(famSumWater).toBeCloseTo(fp.totals.waterL, 3);
    }
  });

  test("byFamily keys are recognised process families", () => {
    const VALID_FAMILIES = new Set([
      "lithography", "etch", "deposition", "cmp",
      "clean", "implant", "metrology", "thermal",
    ]);
    const chips = listChips();
    for (const chip of chips) {
      const fp = computeFootprint(chip);
      for (const fam of Object.keys(fp.byFamily)) {
        expect(VALID_FAMILIES.has(fam)).toBe(true);
      }
    }
  });
});
