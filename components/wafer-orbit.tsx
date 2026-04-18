'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  animate,
} from 'framer-motion';
import type { Chip } from '@/lib/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const WAFER_USABLE_AREA_MM2 = 70_000;
const SCRIBE_ALLOWANCE_MM2 = 3;
const SVG_SIZE = 500;
const CENTER = SVG_SIZE / 2;
const WAFER_RADIUS = 220;
const SCALE = WAFER_RADIUS / 150; // 1mm = this many px
const SWEEP_DURATION = 6;
const HOLD_DURATION = 1;
const DIM_DURATION = 0.5;
const ROTATION_DURATION = 90;
const PULSE_DURATION = 2;

// ---------------------------------------------------------------------------
// Wafer outline path (circle with notch at bottom)
// ---------------------------------------------------------------------------
function waferOutlinePath(): string {
  const cx = CENTER;
  const cy = CENTER;
  const r = WAFER_RADIUS;
  // Notch at bottom: 10px wide, 6px deep
  const notchHalf = 5;
  const notchDepth = 6;
  // Angle at which notch starts/ends
  const notchAngle = Math.asin(notchHalf / r);
  // Start just after notch on the right side, go CCW (large arc), then notch
  const startAngle = Math.PI / 2 - notchAngle;
  const endAngle = Math.PI / 2 + notchAngle;

  const sx = cx + r * Math.cos(startAngle);
  const sy = cy + r * Math.sin(startAngle);
  const ex = cx + r * Math.cos(endAngle);
  const ey = cy + r * Math.sin(endAngle);
  const notchTipY = cy + r + notchDepth;

  // Arc from start to end, the long way around (large-arc=1, sweep=0 for CCW)
  return [
    `M ${sx} ${sy}`,
    `A ${r} ${r} 0 1 0 ${ex} ${ey}`,
    `L ${cx} ${notchTipY}`,
    `Z`,
  ].join(' ');
}

const WAFER_PATH = waferOutlinePath();

// ---------------------------------------------------------------------------
// Die grid generation
// ---------------------------------------------------------------------------
interface DieInfo {
  x: number;
  y: number;
  w: number;
  h: number;
  ring: number;
  dist: number;
}

function generateDieGrid(dieAreaMm2: number): { dies: DieInfo[]; numRings: number } {
  const dieSideMm = Math.sqrt(dieAreaMm2);
  const dieSidePx = dieSideMm * SCALE;
  const spacing = dieSidePx + 2; // 2px scribe line

  const dies: DieInfo[] = [];

  // Start from center, lay out a grid
  const halfCount = Math.ceil(WAFER_RADIUS / spacing) + 1;

  for (let row = -halfCount; row <= halfCount; row++) {
    for (let col = -halfCount; col <= halfCount; col++) {
      const x = CENTER + col * spacing - dieSidePx / 2;
      const y = CENTER + row * spacing - dieSidePx / 2;

      // Check all 4 corners fit within wafer circle
      const corners = [
        [x, y],
        [x + dieSidePx, y],
        [x, y + dieSidePx],
        [x + dieSidePx, y + dieSidePx],
      ];

      const allInside = corners.every(([cx, cy]) => {
        const dx = cx - CENTER;
        const dy = cy - CENTER;
        return Math.sqrt(dx * dx + dy * dy) < WAFER_RADIUS - 2;
      });

      if (allInside) {
        const dieCenterX = x + dieSidePx / 2;
        const dieCenterY = y + dieSidePx / 2;
        const dist = Math.sqrt(
          (dieCenterX - CENTER) ** 2 + (dieCenterY - CENTER) ** 2
        );
        dies.push({
          x,
          y,
          w: dieSidePx,
          h: dieSidePx,
          ring: 0, // computed below
          dist,
        });
      }
    }
  }

  // Bucket into concentric rings
  const ringWidth = dieSidePx;
  let maxRing = 0;
  for (const die of dies) {
    die.ring = Math.floor(die.dist / ringWidth);
    if (die.ring > maxRing) maxRing = die.ring;
  }

  // Sort by ring then by distance for deterministic order
  dies.sort((a, b) => a.ring - b.ring || a.dist - b.dist);

  return { dies, numRings: maxRing + 1 };
}

function computeCandidateDies(chip: Chip): number {
  return Math.floor(
    WAFER_USABLE_AREA_MM2 / (chip.dieAreaMm2 + SCRIBE_ALLOWANCE_MM2)
  );
}

// ---------------------------------------------------------------------------
// Die component (plain SVG rect, no motion component)
// ---------------------------------------------------------------------------
interface DieProps {
  die: DieInfo;
  state: 'off' | 'lit' | 'glow' | 'locked';
}

function Die({ die, state }: DieProps) {
  const isOff = state === 'off';
  const isGlow = state === 'glow';
  const isLocked = state === 'locked';

  return (
    <rect
      x={die.x}
      y={die.y}
      width={die.w}
      height={die.h}
      fill={
        isOff
          ? 'oklch(0.92 0.01 250 / 0.3)'
          : 'var(--color-accent, oklch(0.65 0.12 170))'
      }
      stroke={isOff ? 'oklch(0.55 0.02 250 / 0.5)' : 'oklch(0.35 0.1 170)'}
      strokeWidth={isOff ? 0.6 : 0.8}
      opacity={isOff ? 0.5 : isLocked ? undefined : 1}
      filter={isGlow ? 'url(#die-glow)' : undefined}
      className={isLocked ? 'animate-die-pulse' : undefined}
    />
  );
}

// ---------------------------------------------------------------------------
// WaferOrbit
// ---------------------------------------------------------------------------
export interface WaferOrbitProps {
  chip: Chip;
  isSelected: boolean;
}

export function WaferOrbit({ chip, isSelected }: WaferOrbitProps) {
  const prefersReduced = useReducedMotion();
  const sweepRing = useMotionValue(-1);
  const [litRingIndex, setLitRingIndex] = useState(-1);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const loopRef = useRef(true);

  const { dies, numRings } = useMemo(
    () => generateDieGrid(chip.dieAreaMm2),
    [chip.dieAreaMm2]
  );

  const diesPerWafer = computeCandidateDies(chip);
  const yieldPercent = Math.round(chip.yieldAssumption * 100);

  // Track sweep ring for re-renders
  useMotionValueEvent(sweepRing, 'change', (v: number) => {
    setLitRingIndex(Math.floor(v));
  });

  // Sweep animation cycle
  const runSweepCycle = useCallback(async () => {
    if (!loopRef.current) return;

    // Phase 1: expand from center
    animRef.current = animate(sweepRing, numRings, {
      duration: SWEEP_DURATION,
      ease: 'linear',
    });
    await animRef.current;

    if (!loopRef.current) return;

    // Phase 2: hold
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, HOLD_DURATION * 1000);
      // Store cleanup ref
      if (!loopRef.current) {
        clearTimeout(t);
        resolve();
      }
    });

    if (!loopRef.current) return;

    // Phase 3: dim
    animRef.current = animate(sweepRing, -1, {
      duration: DIM_DURATION,
      ease: 'easeIn',
    });
    await animRef.current;

    if (!loopRef.current) return;

    // Loop
    runSweepCycle();
  }, [sweepRing, numRings]);

  useEffect(() => {
    if (prefersReduced) {
      sweepRing.set(numRings);
      return;
    }

    if (isSelected) {
      // Freeze at fully lit
      animRef.current?.stop();
      sweepRing.set(numRings);
      return;
    }

    // Start sweep cycle
    loopRef.current = true;
    sweepRing.set(-1);
    runSweepCycle();

    return () => {
      loopRef.current = false;
      animRef.current?.stop();
    };
  }, [chip.id, isSelected, prefersReduced, sweepRing, numRings, runSweepCycle]);

  return (
    <div className="flex flex-col items-center gap-2" style={{ width: 'min(480px, 90vw)' }}>
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full h-auto"
        aria-label={`300mm wafer with ${diesPerWafer} candidate dies for ${chip.name}`}
      >
        <defs>
          <filter id="die-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx={0}
              dy={0}
              stdDeviation={3}
              floodColor="oklch(0.65 0.12 170 / 0.6)"
            />
          </filter>
        </defs>

        {/* Rotating wafer group */}
        <motion.g
          animate={prefersReduced ? undefined : { rotate: 360 }}
          transition={
            prefersReduced
              ? undefined
              : {
                  duration: ROTATION_DURATION,
                  repeat: Infinity,
                  ease: 'linear',
                }
          }
          style={{ originX: `${CENTER}px`, originY: `${CENTER}px` }}
        >
          {/* Wafer outline */}
          <path
            d={WAFER_PATH}
            fill="oklch(0.97 0.005 250 / 0.4)"
            stroke="var(--color-wafer-outline, oklch(0.55 0.02 250))"
            strokeWidth={1.5}
          />

          {/* Die grid with AnimatePresence for chip transitions */}
          <AnimatePresence mode="wait">
            <motion.g
              key={chip.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {dies.map((die, i) => {
                let state: DieProps['state'];
                if (prefersReduced || (isSelected && litRingIndex >= numRings - 1)) {
                  state = isSelected ? 'locked' : 'lit';
                } else if (die.ring <= litRingIndex) {
                  state = die.ring === litRingIndex ? 'glow' : 'lit';
                } else {
                  state = 'off';
                }
                return <Die key={i} die={die} state={state} />;
              })}
            </motion.g>
          </AnimatePresence>
        </motion.g>
      </svg>

      {/* Labels */}
      <div className="text-center space-y-0.5">
        <p
          className="text-[11px]"
          style={{ color: 'oklch(0.45 0.02 250)' }}
        >
          300mm wafer
        </p>
        <p
          className="font-mono text-[11px]"
          style={{ color: 'oklch(0.45 0.02 250)' }}
        >
          {diesPerWafer} candidate dies · yield {yieldPercent}%
        </p>
      </div>
    </div>
  );
}
