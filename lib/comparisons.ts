// Human-relatable comparisons for environmental metrics

/** 1 standard bathtub ≈ 150 L */
export function waterToBathtubs(liters: number): string {
  const bathtubs = liters / 150;
  if (bathtubs < 1) return `${(liters / 0.5).toFixed(0)} bottles of water (500 mL)`;
  if (bathtubs < 10) return `${bathtubs.toFixed(1)} bathtubs of water`;
  return `${Math.round(bathtubs)} bathtubs of water`;
}

/** Average Indian household uses ~170 L/day */
export function waterToHouseholdDays(liters: number): string {
  const days = liters / 170;
  if (days < 1) return `${(days * 24).toFixed(0)} hours of household water use`;
  return `${days.toFixed(1)} days of household water use`;
}

/** 1 window AC in India ≈ 1.5 kWh per hour */
export function energyToACHours(kwh: number): string {
  const hours = kwh / 1.5;
  if (hours < 1) return `${(hours * 60).toFixed(0)} minutes of running an AC`;
  if (hours < 24) return `${hours.toFixed(1)} hours of running an AC`;
  return `${(hours / 24).toFixed(1)} days of running an AC 24/7`;
}

/** Average Indian household uses ~90 kWh/month */
export function energyToHouseholdDays(kwh: number): string {
  const days = kwh / 3; // ~3 kWh/day
  if (days < 1) return `${(days * 24).toFixed(0)} hours of home electricity`;
  return `${days.toFixed(1)} days of home electricity`;
}

/** Average car emits ~0.21 kg CO2e per km */
export function ghgToCarKm(kgCo2e: number): string {
  const km = kgCo2e / 0.21;
  if (km < 1) return `${(km * 1000).toFixed(0)} meters of driving a car`;
  if (km < 100) return `${km.toFixed(1)} km of driving a car`;
  return `${Math.round(km)} km of driving a car`;
}

/** Delhi–Mumbai flight ≈ 180 kg CO2e per passenger */
export function ghgToFlightFraction(kgCo2e: number): string {
  const fraction = kgCo2e / 180;
  if (fraction < 0.01) return `${(fraction * 100).toFixed(2)}% of a Delhi–Mumbai flight`;
  if (fraction < 1) return `${(fraction * 100).toFixed(1)}% of a Delhi–Mumbai flight`;
  return `${fraction.toFixed(1)}× a Delhi–Mumbai flight`;
}

/** Format a number with appropriate precision */
export function formatMetric(value: number, decimals?: number): string {
  if (value >= 1000) return value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  if (value >= 100) return value.toFixed(decimals ?? 0);
  if (value >= 10) return value.toFixed(decimals ?? 1);
  if (value >= 1) return value.toFixed(decimals ?? 1);
  if (value >= 0.01) return value.toFixed(decimals ?? 2);
  return value.toFixed(decimals ?? 3);
}

export function getComparison(
  metric: "waterL" | "energyKwh" | "ghgTotalKgCo2e" | "pfasKgCo2e",
  value: number
): string {
  switch (metric) {
    case "waterL":
      return waterToBathtubs(value);
    case "energyKwh":
      return energyToACHours(value);
    case "ghgTotalKgCo2e":
      return ghgToCarKm(value);
    case "pfasKgCo2e":
      return ghgToCarKm(value); // PFAS expressed as CO2e, same comparison works
  }
}
