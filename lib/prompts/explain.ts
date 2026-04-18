import type { ComputedFootprint } from "../types";

export function buildExplainSystemInstruction(): string {
  return `You are a clear, neutral science explainer writing for a general audience.

You will be given structured data about the manufacturing footprint of one
semiconductor chip. Your job: write 2–3 short paragraphs (under 180 words)
that make these numbers feel real.

Rules:
- Only use numbers from the provided data. Do not invent figures.
- If the data is missing something, say so.
- Use one concrete comparison per paragraph (e.g. "equivalent to X bathtubs of water" or "like driving Y km in a car").
- Do not praise or criticize any company. Focus on the physics of the process.
- No marketing tone. No alarmism. Just clarity.
- Use simple language accessible to someone without an engineering background.
- Format your response in clean Markdown with paragraph breaks.`;
}

export function buildExplainUserMessage(footprint: ComputedFootprint): string {
  const { chip, totals, perWafer, byFamily, goodDiesPerWafer, totalSteps } =
    footprint;

  return `Here is the manufacturing footprint data for a single ${chip.name}:

**Chip specifications:**
- Vendor: ${chip.vendor}
- Process node: ${chip.nodeFamily} (${chip.nodeNm}nm)
- Die area: ${chip.dieAreaMm2} mm²
- Estimated mask count: ${chip.estimatedMaskCount}
- Total process steps: ${totalSteps}
- Yield assumption: ${(chip.yieldAssumption * 100).toFixed(0)}%
- Good dies per wafer: ${goodDiesPerWafer.toFixed(0)}
- Powers: ${chip.powers}

**Per-die environmental footprint (manufacturing one chip):**
- Water: ${totals.waterL.toFixed(1)} liters
- Energy: ${totals.energyKwh.toFixed(1)} kWh
- GHG (Scope 2, from electricity): ${totals.ghgScope2KgCo2e.toFixed(1)} kg CO₂e
- GHG (F-gas / PFAS): ${totals.pfasKgCo2e.toFixed(1)} kg CO₂e
- Total GHG: ${totals.ghgTotalKgCo2e.toFixed(1)} kg CO₂e

**Per-wafer totals (all ${goodDiesPerWafer.toFixed(0)} good dies):**
- Water: ${perWafer.waterL.toFixed(0)} L
- Energy: ${perWafer.energyKwh.toFixed(0)} kWh
- Total GHG: ${perWafer.ghgTotalKgCo2e.toFixed(0)} kg CO₂e

**Breakdown by process family:**
${Object.entries(byFamily)
  .sort((a, b) => b[1].ghgTotalKgCo2e - a[1].ghgTotalKgCo2e)
  .map(
    ([fam, v]) =>
      `- ${fam}: water ${v.waterL.toFixed(1)}L, energy ${v.energyKwh.toFixed(1)}kWh, GHG ${v.ghgTotalKgCo2e.toFixed(1)}kg CO₂e`
  )
  .join("\n")}

${chip.notes ? `\n**Notes:** ${chip.notes}` : ""}

Please write 2–3 paragraphs making these numbers intuitive for a general audience.`;
}
