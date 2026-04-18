'use client';

import { useReducedMotion, useScroll, useTransform, motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Seeded PRNG (seed 137) — deterministic, SSR-safe
// ---------------------------------------------------------------------------
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function lerp(min: number, max: number, t: number) {
  return min + (max - min) * t;
}

// ---------------------------------------------------------------------------
// Rectangle generation — runs once at module load
// ---------------------------------------------------------------------------
interface MaskRect {
  widthPercent: number;
  heightPercent: number;
  xPercent: number;
  yPercent: number;
  rotation: number;
  depth: number;
  driftDuration: number;
  driftAmount: number;
  driftDelay: number;
  driftDirection: number; // 1 = right, -1 = left
}

function generateRects(): MaskRect[] {
  const rand = seededRandom(137);
  const rects: MaskRect[] = [];

  for (let i = 0; i < 20; i++) {
    rects.push({
      widthPercent: lerp(35, 70, rand()),
      heightPercent: lerp(12, 25, rand()),
      xPercent: lerp(-10, 90, rand()),
      yPercent: lerp(-5, 95, rand()),
      rotation: lerp(-3, 3, rand()),
      depth: i / 20,
      driftDuration: lerp(20, 60, rand()),
      driftAmount: lerp(20, 80, rand()),
      driftDelay: lerp(0, 20, rand()),
      driftDirection: i % 2 === 0 ? 1 : -1,
    });
  }

  return rects;
}

const MASK_RECTS = generateRects();

// ---------------------------------------------------------------------------
// Single rectangle component
// ---------------------------------------------------------------------------
function MaskRectangle({ rect, prefersReduced }: { rect: MaskRect; prefersReduced: boolean | null }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, -150 * rect.depth]);

  const opacity = 0.04 + rect.depth * 0.10;

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: `${rect.widthPercent}%`,
        height: `${rect.heightPercent}%`,
        left: `${rect.xPercent}%`,
        top: `${rect.yPercent}%`,
        rotate: rect.rotation,
        opacity,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--color-mask, oklch(0.55 0.04 180))',
        backgroundColor: 'transparent',
        borderRadius: '6px',
        willChange: 'transform',
        y,
      }}
      animate={
        prefersReduced
          ? undefined
          : {
              x: [0, rect.driftAmount * rect.driftDirection],
            }
      }
      transition={
        prefersReduced
          ? undefined
          : {
              x: {
                duration: rect.driftDuration,
                repeat: Infinity,
                repeatType: 'reverse' as const,
                ease: 'easeInOut',
                delay: rect.driftDelay,
              },
            }
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function MaskLayerStack() {
  const prefersReduced = useReducedMotion();

  return (
    <div
      className="mask-layer-stack fixed inset-0 pointer-events-none transition-opacity duration-[400ms]"
      style={{ zIndex: -5 }}
      aria-hidden="true"
    >
      {MASK_RECTS.map((rect, i) => (
        <MaskRectangle key={i} rect={rect} prefersReduced={prefersReduced} />
      ))}
    </div>
  );
}
