/**
 * tests/data.test.ts
 * Validates the integrity of all JSON data files (chips.json, processes.json, sources.json)
 * by parsing them through the Zod schemas used by the app itself.
 */

import { listChips, listProcesses, listSources, getChip, getProcess, getSource } from "@/lib/data";

// ── chips.json ────────────────────────────────────────────────────────────────

describe("chips.json", () => {
  const chips = listChips();

  test("loads at least one chip", () => {
    expect(chips.length).toBeGreaterThanOrEqual(1);
  });

  test("every chip has required string fields", () => {
    for (const chip of chips) {
      expect(typeof chip.id).toBe("string");
      expect(chip.id.length).toBeGreaterThan(0);
      expect(typeof chip.name).toBe("string");
      expect(typeof chip.vendor).toBe("string");
      expect(typeof chip.nodeFamily).toBe("string");
      expect(typeof chip.powers).toBe("string");
    }
  });

  test("every chip has valid numeric fields", () => {
    for (const chip of chips) {
      expect(chip.nodeNm).toBeGreaterThan(0);
      expect(chip.dieAreaMm2).toBeGreaterThan(0);
      expect(chip.estimatedMaskCount).toBeGreaterThan(0);
      expect(chip.launchYear).toBeGreaterThanOrEqual(2000);
      expect(chip.yieldAssumption).toBeGreaterThan(0);
      expect(chip.yieldAssumption).toBeLessThanOrEqual(1);
    }
  });

  test("every chip has a non-empty processMix", () => {
    for (const chip of chips) {
      expect(chip.processMix.length).toBeGreaterThan(0);
      for (const item of chip.processMix) {
        expect(typeof item.processId).toBe("string");
        expect(item.stepCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test("chip IDs are unique", () => {
    const ids = chips.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  test("getChip returns correct chip by id", () => {
    const first = chips[0];
    const found = getChip(first.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(first.id);
  });

  test("getChip returns undefined for unknown id", () => {
    expect(getChip("__nonexistent__")).toBeUndefined();
  });
});

// ── processes.json ────────────────────────────────────────────────────────────

describe("processes.json", () => {
  const processes = listProcesses();

  test("loads at least one process", () => {
    expect(processes.length).toBeGreaterThanOrEqual(1);
  });

  test("every process has valid perStepPerWafer metrics", () => {
    const metrics = ["waterL", "energyKwh", "ghgScope2KgCo2e", "pfasKgCo2e"] as const;
    for (const proc of processes) {
      for (const m of metrics) {
        const mv = proc.perStepPerWafer[m];
        expect(typeof mv.value).toBe("number");
        expect(mv.value).toBeGreaterThanOrEqual(0);
        expect(typeof mv.sourceId).toBe("string");
        expect(["high", "medium", "low", "estimated"]).toContain(mv.confidence);
      }
    }
  });

  test("process IDs are unique", () => {
    const ids = processes.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("getProcess returns correct process", () => {
    const first = processes[0];
    const found = getProcess(first.id);
    expect(found?.id).toBe(first.id);
  });
});

// ── sources.json ──────────────────────────────────────────────────────────────

describe("sources.json", () => {
  const sources = listSources();

  test("loads at least one source", () => {
    expect(sources.length).toBeGreaterThanOrEqual(1);
  });

  test("every source has required fields", () => {
    for (const src of sources) {
      expect(typeof src.id).toBe("string");
      expect(typeof src.title).toBe("string");
      expect(typeof src.org).toBe("string");
      expect(src.year).toBeGreaterThanOrEqual(2000);
      expect(["report", "paper", "dataset", "article", "official_doc"]).toContain(src.type);
      // URL must be a valid URL string (Zod already validated this; double-check here)
      expect(() => new URL(src.url)).not.toThrow();
    }
  });

  test("source IDs are unique", () => {
    const ids = sources.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("getSource returns correct source", () => {
    const first = sources[0];
    expect(getSource(first.id)?.id).toBe(first.id);
  });
});

// ── cross-reference integrity ─────────────────────────────────────────────────

describe("cross-reference integrity", () => {
  const chips = listChips();
  const processes = listProcesses();
  const sources = listSources();
  const processIds = new Set(processes.map((p) => p.id));
  const sourceIds = new Set(sources.map((s) => s.id));

  test("every chip.processMix references a known processId", () => {
    for (const chip of chips) {
      for (const item of chip.processMix) {
        expect(processIds.has(item.processId)).toBe(true);
      }
    }
  });

  test("every chip.specSourceId references a known sourceId (when set)", () => {
    for (const chip of chips) {
      if (chip.specSourceId) {
        expect(sourceIds.has(chip.specSourceId)).toBe(true);
      }
    }
  });

  test("every process metric sourceId references a known source", () => {
    const metrics = ["waterL", "energyKwh", "ghgScope2KgCo2e", "pfasKgCo2e"] as const;
    for (const proc of processes) {
      for (const m of metrics) {
        const sid = proc.perStepPerWafer[m].sourceId;
        expect(sourceIds.has(sid)).toBe(true);
      }
    }
  });
});
