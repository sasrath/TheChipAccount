import type { ComputedFootprint } from "@/lib/types";
import { MetricTile } from "./metric-tile";
import { ProcessChart } from "./process-chart";
import { ExplainPanel } from "./explain-panel";
import { Chat } from "./chat";
import { Badge } from "@/components/ui/badge";
import { getComparison } from "@/lib/comparisons";
import { getSource } from "@/lib/data";

interface Props {
  footprint: ComputedFootprint;
}

export function Dashboard({ footprint }: Props) {
  const { chip, totals, byFamily, goodDiesPerWafer, totalSteps, sourceIds } =
    footprint;

  const sources = sourceIds
    .map((id) => getSource(id))
    .filter((s): s is NonNullable<typeof s> => s != null);

  const byFamilyData = Object.entries(byFamily).map(([name, values]) => ({
    name,
    ...values,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h2 className="text-2xl font-bold">{chip.name}</h2>
        <p className="text-muted-foreground mt-1">{chip.vendor}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="secondary">{chip.nodeFamily}</Badge>
          <Badge variant="secondary">{chip.dieAreaMm2} mm² die</Badge>
          <Badge variant="secondary">~{chip.estimatedMaskCount} masks</Badge>
          <Badge variant="secondary">{totalSteps} process steps</Badge>
          <Badge variant="secondary">
            {goodDiesPerWafer.toFixed(0)} good dies/wafer
          </Badge>
          <Badge variant="secondary">
            {(chip.yieldAssumption * 100).toFixed(0)}% yield
          </Badge>
        </div>
        {chip.notes && (
          <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
            {chip.notes}
          </p>
        )}
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          label="Water"
          value={totals.waterL}
          unit="L"
          comparison={getComparison("waterL", totals.waterL)}
          icon="droplets"
          sources={sources}
          chipId={chip.id}
        />
        <MetricTile
          label="Energy"
          value={totals.energyKwh}
          unit="kWh"
          comparison={getComparison("energyKwh", totals.energyKwh)}
          icon="zap"
          sources={sources}
          chipId={chip.id}
        />
        <MetricTile
          label="GHG Emissions"
          value={totals.ghgTotalKgCo2e}
          unit="kg CO₂e"
          comparison={getComparison("ghgTotalKgCo2e", totals.ghgTotalKgCo2e)}
          icon="cloud"
          sources={sources}
          chipId={chip.id}
        />
        <MetricTile
          label="F-gas / PFAS"
          value={totals.pfasKgCo2e}
          unit="kg CO₂e"
          comparison={getComparison("pfasKgCo2e", totals.pfasKgCo2e)}
          icon="flask-conical"
          sources={sources}
          chipId={chip.id}
        />
      </div>

      {/* Process Chart */}
      <ProcessChart data={byFamilyData} />

      {/* Gemini Explanation */}
      <ExplainPanel chipId={chip.id} />

      {/* Q&A Chat */}
      <Chat chipId={chip.id} />
    </div>
  );
}
