'use client';

import { useRef, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Seeded PRNG — deterministic on server & client (no hydration mismatch)
// ---------------------------------------------------------------------------
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------------------
// Contour generation (runs once at module load — deterministic)
// ---------------------------------------------------------------------------
function generateContours(): string[] {
  const rand = seededRandom(42);
  const paths: string[] = [];

  for (let i = 0; i < 8; i++) {
    const baseY = 100 + (i * 800) / 7;
    const numPoints = 6 + Math.floor(rand() * 5); // 6-10 points
    const xStep = 1600 / (numPoints - 1);

    const points: { x: number; y: number }[] = [];
    for (let j = 0; j < numPoints; j++) {
      const x = j * xStep + (rand() - 0.5) * 60;
      const y = baseY + (rand() - 0.5) * 80;
      points.push({ x, y });
    }

    // Build the path
    let d = `M ${points[0].x} ${points[0].y}`;

    for (let j = 1; j < points.length; j++) {
      const prev = points[j - 1];
      const curr = points[j];

      // ~15% chance of a right-angle segment
      if (rand() < 0.15) {
        // L-shaped: horizontal then vertical, or vertical then horizontal
        if (rand() < 0.5) {
          d += ` L ${curr.x} ${prev.y} L ${curr.x} ${curr.y}`;
        } else {
          d += ` L ${prev.x} ${curr.y} L ${curr.x} ${curr.y}`;
        }
      } else {
        // Smooth cubic Bézier
        const cx1 = prev.x + (curr.x - prev.x) * 0.33 + (rand() - 0.5) * 40;
        const cy1 = prev.y + (rand() - 0.5) * 40;
        const cx2 = prev.x + (curr.x - prev.x) * 0.66 + (rand() - 0.5) * 40;
        const cy2 = curr.y + (rand() - 0.5) * 40;
        d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
      }
    }

    paths.push(d);
  }

  return paths;
}

const CONTOUR_PATHS = generateContours();
const SAFE_DASH_LENGTH = 4000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function EtchedTopography() {
  const prefersReduced = useReducedMotion();
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    // Set stroke-dasharray from actual path length for accuracy
    pathRefs.current.forEach((el) => {
      if (el) {
        const len = el.getTotalLength();
        el.style.strokeDasharray = `${len}`;
      }
    });
  }, []);

  return (
    <svg
      className="fixed inset-0 -z-10 pointer-events-none h-full w-full"
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <style>{`
        @keyframes etch-draw {
          0%   { stroke-dashoffset: ${SAFE_DASH_LENGTH}; }
          50%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: ${SAFE_DASH_LENGTH}; }
        }
      `}</style>
      {CONTOUR_PATHS.map((d, i) => {
        const opacity = 0.06 + (i / 7) * 0.04;
        return (
          <path
            key={i}
            ref={(el) => { pathRefs.current[i] = el; }}
            d={d}
            fill="none"
            stroke="var(--color-topography, oklch(0.35 0.03 150))"
            strokeWidth={1}
            opacity={opacity}
            strokeDasharray={SAFE_DASH_LENGTH}
            style={{
              animation: `etch-draw 90s ease-in-out ${-i * 5.6}s infinite`,
              animationPlayState: prefersReduced ? 'paused' : 'running',
            }}
          />
        );
      })}
    </svg>
  );
}
