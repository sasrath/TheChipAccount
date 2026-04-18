import type { ComputedFootprint } from "../types";

export function buildChatSystemInstruction(): string {
  return `You are an assistant grounded in a specific dataset about semiconductor chip manufacturing.

You have access to:
- The chip's metadata (node, die size, mask count, yield assumption)
- Per-process environmental coefficients (water, energy, GHG, PFAS)
- The citations backing each number

Rules:
- Answer ONLY from the provided data and well-established semiconductor engineering facts (e.g. "EUV wavelength is 13.5nm" is fine).
- If the question is outside the data, say "I don't have that data for this chip" and suggest what data would answer it.
- Quote specific numbers when relevant.
- Keep answers under 150 words unless the user explicitly asks for depth.
- Format responses in clean Markdown.
- Do not praise or criticize any company. Focus on the science and engineering.
- Be honest about uncertainties — flag low-confidence numbers when citing them.`;
}

export function buildChatContext(footprint: ComputedFootprint): string {
  const { chip, totals, perWafer, byFamily, goodDiesPerWafer, totalSteps } =
    footprint;

  return `You are answering questions about the manufacturing footprint of: ${chip.name}

**Chip specifications:**
- Vendor: ${chip.vendor}
- Process node: ${chip.nodeFamily} (${chip.nodeNm}nm)
- Die area: ${chip.dieAreaMm2} mm²
- Estimated mask count: ${chip.estimatedMaskCount}
- Total process steps: ${totalSteps}
- Yield assumption: ${(chip.yieldAssumption * 100).toFixed(0)}%
- Good dies per wafer: ${goodDiesPerWafer.toFixed(0)}
- Launch year: ${chip.launchYear}
- Powers: ${chip.powers}

**Per-die footprint:**
- Water: ${totals.waterL.toFixed(1)} L
- Energy: ${totals.energyKwh.toFixed(1)} kWh
- GHG (electricity / Scope 2): ${totals.ghgScope2KgCo2e.toFixed(1)} kg CO₂e
- GHG (F-gas / PFAS): ${totals.pfasKgCo2e.toFixed(1)} kg CO₂e
- Total GHG: ${totals.ghgTotalKgCo2e.toFixed(1)} kg CO₂e

**Per-wafer totals:**
- Water: ${perWafer.waterL.toFixed(0)} L
- Energy: ${perWafer.energyKwh.toFixed(0)} kWh
- Total GHG: ${perWafer.ghgTotalKgCo2e.toFixed(0)} kg CO₂e

**Breakdown by process family (per die):**
${Object.entries(byFamily)
  .sort((a, b) => b[1].ghgTotalKgCo2e - a[1].ghgTotalKgCo2e)
  .map(
    ([fam, v]) =>
      `- ${fam}: water ${v.waterL.toFixed(1)}L, energy ${v.energyKwh.toFixed(1)}kWh, GHG ${v.ghgTotalKgCo2e.toFixed(1)}kg CO₂e (Scope2: ${v.ghgScope2KgCo2e.toFixed(1)}, F-gas: ${v.pfasKgCo2e.toFixed(1)})`
  )
  .join("\n")}

${chip.notes ? `**Notes:** ${chip.notes}` : ""}

Wafer parameters: 300mm diameter, ${70000} mm² usable area, ${3} mm² scribe allowance per die.`;
}
