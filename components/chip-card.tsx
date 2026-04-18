"use client";

import { motion } from "framer-motion";
import { Cpu } from "lucide-react";
import type { Chip } from "@/lib/types";

interface Props {
  chip: Chip;
  isSelected: boolean;
  onSelect: () => void;
}

export function ChipCard({ chip, isSelected, onSelect }: Props) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`text-left w-full rounded-lg border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring backdrop-blur-sm ${
        isSelected
          ? "border-primary bg-primary/70 ring-1 ring-primary/20"
          : "border-border bg-card/70 hover:border-primary/40 hover:bg-accent/60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Cpu className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm leading-tight truncate">
            {chip.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{chip.vendor}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-muted-foreground">
            <span>{chip.nodeFamily}</span>
            <span>{chip.dieAreaMm2} mm²</span>
            <span>{chip.launchYear}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
            {chip.powers}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
