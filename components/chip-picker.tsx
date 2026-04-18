"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChipCard } from "./chip-card";
import { WaferOrbit } from "./wafer-orbit";
import type { Chip } from "@/lib/types";

interface Props {
  chips: Chip[];
  selectedId?: string;
}

export function ChipPicker({ chips, selectedId }: Props) {
  const router = useRouter();
  const [hoveredChip, setHoveredChip] = useState<Chip | null>(null);

  const selectedChip = selectedId
    ? chips.find((c) => c.id === selectedId) ?? null
    : null;
  const currentChip = hoveredChip ?? selectedChip ?? chips[0];

  const handleSelect = (chipId: string) => {
    router.push(`/?chip=${chipId}`, { scroll: false });
  };

  return (
    <div className="relative">
      {/* Wafer spins behind the chip cards */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 overflow-visible">
        <WaferOrbit
          chip={currentChip}
          isSelected={!!selectedChip && !hoveredChip}
        />
      </div>
      <div
        className="relative z-10 w-full overflow-y-auto overscroll-contain rounded-lg border border-border bg-transparent"
        style={{ maxHeight: "540px" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {chips.map((chip) => (
            <div
              key={chip.id}
              onMouseEnter={() => setHoveredChip(chip)}
              onMouseLeave={() => setHoveredChip(null)}
              onFocus={() => setHoveredChip(chip)}
              onBlur={() => setHoveredChip(null)}
            >
              <ChipCard
                chip={chip}
                isSelected={chip.id === selectedId}
                onSelect={() => handleSelect(chip.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
