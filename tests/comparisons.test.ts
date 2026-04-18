/**
 * tests/comparisons.test.ts
 * Tests lib/comparisons.ts — human-readable metric helpers and formatMetric.
 */

import {
  waterToBathtubs,
  waterToHouseholdDays,
  energyToACHours,
  energyToHouseholdDays,
  ghgToCarKm,
  ghgToFlightFraction,
  formatMetric,
  getComparison,
} from "@/lib/comparisons";

describe("waterToBathtubs", () => {
  test("very small amounts show bottles", () => {
    const result = waterToBathtubs(0.3);
    expect(result).toContain("bottle");
  });

  test("1–9 bathtubs range", () => {
    expect(waterToBathtubs(300)).toContain("bathtub");
    expect(waterToBathtubs(300)).not.toContain("bottle");
  });

  test("≥10 bathtubs returns rounded integer", () => {
    const result = waterToBathtubs(3000); // 20 bathtubs
    expect(result).toContain("bathtub");
    expect(result).toMatch(/\d+/);
  });
});

describe("waterToHouseholdDays", () => {
  test("less than a day shows hours", () => {
    expect(waterToHouseholdDays(50)).toContain("hour");
  });

  test("multiple days", () => {
    const result = waterToHouseholdDays(1700);
    expect(result).toContain("day");
  });
});

describe("energyToACHours", () => {
  test("less than an hour shows minutes", () => {
    expect(energyToACHours(0.5)).toContain("minute");
  });

  test("hours range (1–23)", () => {
    const result = energyToACHours(3);
    expect(result).toContain("hour");
  });

  test("multiple days", () => {
    const result = energyToACHours(100);
    expect(result).toContain("day");
  });
});

describe("energyToHouseholdDays", () => {
  test("less than a day shows hours", () => {
    expect(energyToHouseholdDays(1)).toContain("hour");
  });

  test("multiple days", () => {
    expect(energyToHouseholdDays(30)).toContain("day");
  });
});

describe("ghgToCarKm", () => {
  test("less than 1 km shows metres", () => {
    expect(ghgToCarKm(0.1)).toContain("meter");
  });

  test("short distances show decimal km", () => {
    const result = ghgToCarKm(10);
    expect(result).toContain("km");
  });

  test("long distances show rounded km", () => {
    const result = ghgToCarKm(500);
    expect(result).toMatch(/\d+ km/);
  });
});

describe("ghgToFlightFraction", () => {
  test("tiny fraction shows percentage with many decimals", () => {
    const result = ghgToFlightFraction(0.001);
    expect(result).toContain("%");
  });

  test("partial flight shows percentage", () => {
    expect(ghgToFlightFraction(18)).toContain("%");
  });

  test("multiple flights shows multiplier", () => {
    const result = ghgToFlightFraction(360);
    expect(result).toContain("×");
  });
});

describe("formatMetric", () => {
  test("values ≥1000 use locale formatting", () => {
    expect(formatMetric(1000)).toBe("1,000");
    expect(formatMetric(5750)).toBe("5,750");
  });

  test("values 100–999 use 0 decimal places by default", () => {
    expect(formatMetric(500)).toBe("500");
  });

  test("values 10–99 use 1 decimal place by default", () => {
    expect(formatMetric(12.345)).toBe("12.3");
  });

  test("values 1–9 use 1 decimal place by default", () => {
    expect(formatMetric(3.456)).toBe("3.5");
  });

  test("values 0.01–0.99 use 2 decimal places", () => {
    expect(formatMetric(0.05)).toBe("0.05");
  });

  test("very small values use 3 decimal places", () => {
    expect(formatMetric(0.001)).toBe("0.001");
  });

  test("custom decimals override default", () => {
    expect(formatMetric(12.345, 2)).toBe("12.35");
  });
});

describe("getComparison", () => {
  test("waterL comparison is non-empty string", () => {
    const result = getComparison("waterL", 100);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("energyKwh comparison is non-empty string", () => {
    expect(getComparison("energyKwh", 10).length).toBeGreaterThan(0);
  });

  test("ghgTotalKgCo2e comparison is non-empty string", () => {
    expect(getComparison("ghgTotalKgCo2e", 25).length).toBeGreaterThan(0);
  });

  test("pfasKgCo2e comparison is non-empty string", () => {
    expect(getComparison("pfasKgCo2e", 5).length).toBeGreaterThan(0);
  });
});
