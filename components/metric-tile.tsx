"use client";

import { Droplets, Zap, Cloud, FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMetric } from "@/lib/comparisons";
import { CitationSheet } from "./citation-sheet";
import type { Source } from "@/lib/types";
import { useState } from "react";

const ICONS = {
  droplets: Droplets,
  zap: Zap,
  cloud: Cloud,
  "flask-conical": FlaskConical,
} as const;

interface Props {
  label: string;
  value: number;
  unit: string;
  comparison: string;
  icon: keyof typeof ICONS;
  sources: Source[];
  chipId: string;
}

export function MetricTile({
  label,
  value,
  unit,
  comparison,
  icon,
  sources,
}: Props) {
  const [showSources, setShowSources] = useState(false);
  const Icon = ICONS[icon];

  return (
    <>
      <Card
        className="cursor-pointer hover:border-primary/40 transition-colors"
        onClick={() => setShowSources(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              {label}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums">
              {formatMetric(value)}
            </span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">= {comparison}</p>
          <Badge
            variant="outline"
            className="mt-2 text-[10px] cursor-pointer"
          >
            View sources
          </Badge>
        </CardContent>
      </Card>
      <CitationSheet
        open={showSources}
        onOpenChange={setShowSources}
        sources={sources}
      />
    </>
  );
}
