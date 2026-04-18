# PROMPT_01 — Etched Topography Background

Paste this into Claude Code / Copilot Chat / Cursor when you are ready to add the ambient background layer to Chipprint. Do not start this until Phase 2.1 of PLAN.md (layout + theme) is done.

---

## Context (read before coding)

You are working on **Chipprint**, a Next.js 15 App Router project. Before writing any code, read these files so your choices are consistent with the rest of the app:

- `AI_RULES.md` — coding rules (strict TS, server-first, no client secrets, Framer Motion sparingly).
- `SKILLS.md` — approved deps only (Tailwind, Framer Motion, lucide-react). **Do not install new packages.**
- `ARCHITECTURE.md` §2 — directory layout. This component lives under `components/` as a client component.
- `app/globals.css` — CSS variables for the earth-tone palette. Use those variables; do not hardcode colors.

If `prefers-reduced-motion: reduce` is set, the animation must freeze (render one still frame).

---

## What to build

Create `components/background/etched-topography.tsx` — a full-viewport ambient SVG background that evokes the surface topography of a polished silicon wafer crossed with a lithographic mask. It is *decorative* and must never distract from the numbers that are the point of the app.

**Visual character:** mostly rounded, organic contour lines (like a topographic map), but with occasional segments that snap to 90° angles — suggesting the moment an organic-looking surface reveals an underlying orthogonal circuit. This subtle blend is on-theme: silicon is a mixture of natural physics and human-imposed geometry.

**Motion character:** extremely slow. Contours redraw over ~45 seconds via `stroke-dashoffset`. Do not animate position, scale, color, or opacity of the contours themselves. No parallax. No mouse tracking. No scroll interaction. The viewer should barely register it as moving.

---

## Exact specification

### Structure
- One full-viewport `<svg>` with `viewBox="0 0 1600 1000"` and `preserveAspectRatio="xMidYMid slice"`.
- Positioned as a `fixed` element covering the entire viewport at `z-index: -10`. Must sit behind every other page element.
- `pointer-events: none` so it never blocks interactions.
- `aria-hidden="true"` — it is purely decorative.

### Contour generation
- Generate 8 contour paths. Each path is a closed-ish horizontal curve drawn with `<path>` using a mix of cubic Bézier segments and occasional straight horizontal/vertical segments.
- The contours should appear to be at different elevations — evenly spaced vertically from y=100 to y=900, with slight horizontal drift so they don't look stacked.
- Each contour should contain 6–10 control points across the width. For ~15% of segments between adjacent points, replace the smooth Bézier with an L-shaped right-angle (horizontal then vertical, or vertical then horizontal). This is what creates the "organic but technical" feel. Randomize which segments snap using a **seeded** pseudo-random function so the shape is deterministic (important for SSR — no hydration mismatch).
- Use a fixed seed like `42`. Export a `seededRandom(seed: number)` helper inside the file.
- Do not regenerate paths on resize. Compute once at module load.

### Styling
- `stroke` uses CSS variable `var(--color-topography, oklch(0.35 0.03 150))`. Fallback to a muted forest green.
- `stroke-width` = 1 (half pixel at 2x density looks best; keep it crisp).
- `fill="none"`.
- Each contour's base `opacity` varies from `0.06` at the top to `0.10` at the bottom — contours fade with elevation, like the surface fading into haze. Do not animate opacity.

### Animation
- Each `<path>` has a `stroke-dasharray` equal to its own path length (compute via `ref.current.getTotalLength()` in an effect, or hardcode a safe over-estimate like 4000).
- `stroke-dashoffset` animates from `length` to `0` over 45 seconds, then back to `length` over 45 seconds, `ease-in-out`, infinite.
- Stagger the 8 contours so they are at different phases of the cycle — each starts at `negative delay = -i * 5.6s`. This means at any moment, some contours are appearing and others disappearing.
- Animation runs via CSS `animation` keyframes, NOT via Framer Motion. CSS is sufficient and uses less main-thread time.
- Wrap the SVG in a component that reads `useReducedMotion()` from Framer Motion and, when true, sets `animation-play-state: paused`. Do not render a separate static version — pausing is enough.

### Performance
- Total DOM: 1 svg + 8 paths. Not a single extra element.
- No `useEffect`, no `useState`, no `useRef` if you can avoid them. If you need `getTotalLength`, use one `useRef` per path and populate `stroke-dasharray` on mount.
- The component must be a client component (`'use client'`) because of `useReducedMotion`. Keep it the only client code in the background layer.

---

## Where it gets mounted

In `app/layout.tsx`, add the component *once*, inside `<body>`, before `{children}`. Example:

```tsx
import { EtchedTopography } from '@/components/background/etched-topography';

// ...
<body>
  <EtchedTopography />
  {children}
</body>
```

Do not mount it in any page file. Do not mount it conditionally. One instance, always rendered.

---

## Acceptance checklist (run before you say you're done)

- [ ] Component file exists at `components/background/etched-topography.tsx` and is a `'use client'` component.
- [ ] TypeScript passes with `strict: true`. No `any`.
- [ ] No new npm packages installed. Only `react`, `framer-motion` (for `useReducedMotion`), and standard Tailwind are imported.
- [ ] Mounted in `app/layout.tsx` before `{children}`, inside `<body>`.
- [ ] Positioned `fixed inset-0 -z-10 pointer-events-none` with `aria-hidden="true"`.
- [ ] SVG renders 8 contour paths with a visible mix of curved and right-angle segments.
- [ ] On the same seed, paths render identically on server and client (no hydration warning in dev console).
- [ ] Animation is slow, looping, and barely noticeable. Moving at ~1 pixel per second, not flashy.
- [ ] `prefers-reduced-motion: reduce` freezes the animation (verify via DevTools → Rendering → Emulate CSS media feature).
- [ ] Numbers, chip cards, and text on top of the background are fully readable — no contrast issue.
- [ ] Component adds no more than ~3KB to the client bundle.
- [ ] On a 375px-wide mobile viewport, the animation still looks intentional (not cut off ugly).
- [ ] No console errors. No Lighthouse accessibility regressions.

---

## Anti-patterns (do NOT do these)

- ❌ Do not use Canvas or WebGL. Overkill and heavier.
- ❌ Do not add particle effects, blobs, gradients that pulse, or anything that "breathes."
- ❌ Do not use `Math.random()` without a seed — it will break SSR hydration.
- ❌ Do not make the contours cross each other wildly. They should read as parallel elevation bands with gentle drift, not spaghetti.
- ❌ Do not tie opacity or color to scroll. This is a background, not an interactive element.
- ❌ Do not reference chip or process data here. This component is purely visual and knows nothing about the rest of the app.
- ❌ Do not match the `oklch` color to the chip-card borders — it should be distinctly more muted.

---

## Why this design

We want a subliminal "silicon surface under glass" feel. Topographic contours signal *measurement* (which this entire app is about). The 90° snaps on ~15% of segments hint at lithography without being literal circuit imagery. Slow motion + low opacity keeps it ambient — the user should only notice it if they stop to look. When they stop to look, it should feel intentional and crafted, not decorative wallpaper.
