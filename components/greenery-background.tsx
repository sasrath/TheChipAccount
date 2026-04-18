"use client";

// Predefined particle data — avoids Math.random() hydration mismatches
const LEAVES = [
  { id: 0,  left: 2,  delay: 0,    dur: 18, size: 18 },
  { id: 1,  left: 8,  delay: 3.5,  dur: 22, size: 14 },
  { id: 2,  left: 15, delay: 7.0,  dur: 16, size: 22 },
  { id: 3,  left: 23, delay: 1.2,  dur: 24, size: 16 },
  { id: 4,  left: 30, delay: 10.0, dur: 17, size: 20 },
  { id: 5,  left: 38, delay: 4.5,  dur: 20, size: 15 },
  { id: 6,  left: 45, delay: 12.0, dur: 15, size: 24 },
  { id: 7,  left: 53, delay: 0.8,  dur: 21, size: 13 },
  { id: 8,  left: 60, delay: 8.5,  dur: 23, size: 18 },
  { id: 9,  left: 68, delay: 5.0,  dur: 18, size: 20 },
  { id: 10, left: 75, delay: 11.0, dur: 16, size: 16 },
  { id: 11, left: 82, delay: 2.0,  dur: 25, size: 22 },
  { id: 12, left: 90, delay: 6.5,  dur: 14, size: 17 },
  { id: 13, left: 96, delay: 14.0, dur: 19, size: 14 },
  { id: 14, left: 5,  delay: 16.0, dur: 20, size: 19 },
  { id: 15, left: 42, delay: 9.0,  dur: 17, size: 21 },
];

const SHAPES = [
  "70% 30% 70% 30% / 30% 70% 30% 70%",
  "40% 60% 30% 70% / 60% 40% 70% 30%",
  "50% 50% 70% 30% / 40% 60% 40% 60%",
];

export function GreeneryBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    >
      {LEAVES.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute animate-leaf-float"
          style={{
            bottom: "-30px",
            left: `${leaf.left}%`,
            animationDelay: `${leaf.delay}s`,
            animationDuration: `${leaf.dur}s`,
            width: `${leaf.size}px`,
            height: `${leaf.size}px`,
            borderRadius: SHAPES[leaf.id % SHAPES.length],
          }}
        />
      ))}
    </div>
  );
}
