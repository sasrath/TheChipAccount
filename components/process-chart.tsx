"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Dynamic import Recharts to keep landing page lean
const BarChart = dynamic(
  () => import("recharts").then((m) => m.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import("recharts").then((m) => m.Bar),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((m) => m.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((m) => m.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => m.CartesianGrid),
  { ssr: false }
);
const RechartsTooltip = dynamic(
  () => import("recharts").then((m) => m.Tooltip),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const Cell = dynamic(
  () => import("recharts").then((m) => m.Cell),
  { ssr: false }
);

type MetricKey =
  | "waterL"
  | "energyKwh"
  | "ghgTotalKgCo2e"
  | "pfasKgCo2e";

const METRICS: { key: MetricKey; label: string; unit: string }[] = [
  { key: "waterL", label: "Water", unit: "L" },
  { key: "energyKwh", label: "Energy", unit: "kWh" },
  { key: "ghgTotalKgCo2e", label: "GHG (Total)", unit: "kg CO₂e" },
  { key: "pfasKgCo2e", label: "F-gas", unit: "kg CO₂e" },
];

const FAMILY_LABELS: Record<string, string> = {
  lithography: "Lithography",
  etch: "Etch",
  deposition: "Deposition",
  cmp: "CMP",
  clean: "Clean",
  implant: "Implant",
  metrology: "Metrology",
  thermal: "Thermal",
};

const COLORS = [
  "oklch(0.55 0.12 160)",
  "oklch(0.55 0.10 250)",
  "oklch(0.60 0.15 45)",
  "oklch(0.50 0.12 300)",
  "oklch(0.55 0.10 80)",
  "oklch(0.60 0.08 180)",
  "oklch(0.50 0.08 30)",
  "oklch(0.55 0.06 130)",
];

interface FamilyData {
  name: string;
  waterL: number;
  energyKwh: number;
  ghgScope2KgCo2e: number;
  pfasKgCo2e: number;
  ghgTotalKgCo2e: number;
}

interface Props {
  data: FamilyData[];
}

export function ProcessChart({ data }: Props) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("ghgTotalKgCo2e");

  const currentMetricInfo = METRICS.find((m) => m.key === activeMetric)!;

  const chartData = useMemo(() => {
    return data
      .map((d) => ({
        name: FAMILY_LABELS[d.name] || d.name,
        value: d[activeMetric],
      }))
      .sort((a, b) => b.value - a.value);
  }, [data, activeMetric]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Process Breakdown (per die)
        </CardTitle>
        <Tabs
          value={activeMetric}
          onValueChange={(v) => setActiveMetric(v as MetricKey)}
          className="mt-2"
        >
          <TabsList className="h-8">
            {METRICS.map((m) => (
              <TabsTrigger key={m.key} value={m.key} className="text-xs px-3">
                {m.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 80, right: 20, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                fontSize={11}
                tickFormatter={(v: number) => v.toFixed(1)}
                label={{
                  value: currentMetricInfo.unit,
                  position: "insideBottomRight",
                  offset: -5,
                  fontSize: 11,
                }}
              />
              <YAxis
                type="category"
                dataKey="name"
                fontSize={11}
                width={75}
              />
              <RechartsTooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [
                  `${Number(value).toFixed(2)} ${currentMetricInfo.unit}`,
                  currentMetricInfo.label,
                ]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
