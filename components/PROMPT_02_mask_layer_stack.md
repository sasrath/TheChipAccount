# PROMPT_02 — Mask-Layer Stack Background

Paste this into Claude Code / Copilot Chat / Cursor after PROMPT_01 is shipped and merged. This layer sits *in front of* the etched topography, but *behind* all content.

---

## Context (read before coding)

Before writing code, read:
- `AI_RULES.md`, `SKILLS.md`, `ARCHITECTURE.md` §2 — same rules as every other component.
- `components/background/etched-topography.tsx` — the layer you are adding on top of. The stack's z-index must place it above topography but below all page content.
- `PROMPT_01_etched_topography.md` — for stylistic consistency. Same palette, same "subliminal, not decorative wallpaper" ethos.

If `prefers-reduced-motion: reduce` is set, the autonomous drift must stop; parallax may continue (scroll-driven motion is user-initiated and generally acceptable under reduced-motion).

---

## What to build

Create `components/background/mask-layer-stack.tsx` — a background of ~20 translucent rectangles stacked in Z (page depth), each representing one "mask layer" of an imaginary semiconductor. The rectangles drift horizontally at different speeds (autonomous) AND parallax vertically as the user scrolls. The result should feel like you are looking *through* a semi-transparent stack of photomasks.

This is the thematic anchor of the site: a modern chip has ~85 mask layers, each a single photograph at nanometer scale, stacked on top of each other. Most visitors will not know this. The background quietly lets them intuit it.

**Visual character:** rectangles are thin, have rounded corners, are outlined (not filled — or filled at very low alpha), and are rotated by tiny amounts (-3° to +3°). Stacked but not aligned — slight offsets in x, y, and rotation. Feels like a spread of transparent photocards.

**Motion character:** each rectangle drifts horizontally on its own cycle (20-60 seconds, wildly different per rectangle). Scroll causes vertical parallax — rectangles further "back" (lower opacity, smaller) move less; rectangles further "forward" move more.

---

## Exact specification

### Structure
- One `<div>` positioned `fixed inset-0 pointer-events-none` at `z-index: -5` (above topography at -10, below all content at 0+).
- `aria-hidden="true"`.
- Contains 20 `<motion.div>` rectangles as children.

### Rectangle generation
- Use a seeded PRNG (seed = `137`). Same seeded approach as topography — deterministic, SSR-safe.
- For each of 20 rectangles, generate once at module load:
  - `widthPercent` — 35 to 70 (% of viewport width)
  - `heightPercent` — 12 to 25 (% of viewport height)
  - `xPercent` — -10 to 90 (left offset, % viewport width — allow some off-screen bleed)
  - `yPercent` — -5 to 95 (top offset, % viewport height)
  - `rotation` — -3 to +3 (degrees)
  - `depth` — derived from index: `depth = i / 20` where i is the rectangle index (0 = furthest back, 1 = furthest forward)
  - `driftDuration` — 20 to 60 seconds
  - `driftAmount` — 20 to 80 pixels
  - `driftDelay` — 0 to 20 seconds (so they don't all restart together)

### Depth-driven styling
Each rectangle's visual weight is controlled by `depth`:

- `opacity` = `0.04 + depth * 0.10` (so deepest layer is 4% opacity, frontmost is 14%).
- `borderWidth` = `1px`. Use `border-style: solid` and `border-color: var(--color-mask, oklch(0.55 0.04 180))`.
- `backgroundColor` = `transparent`. No fills.
- `borderRadius` = `6px`.

### Autonomous horizontal drift
- Each rectangle animates `x` using Framer Motion's `animate` prop with `repeat: Infinity, repeatType: 'reverse'`.
- Direction alternates: even-indexed rectangles drift right, odd drift left. Prevents the whole stack from appearing to slide one way.
- This motion is *independent* of scroll.

### Scroll parallax
- Use Framer Motion's `useScroll()` to get a viewport scroll progress.
- Use `useTransform(scrollY, [0, 1000], [0, -150 * depth])` per rectangle, with output clamped. Deeper rectangles (back) move less; front rectangles move more.
- Pass the transformed value as the `y` prop.
- **Critical:** combine autonomous drift and scroll parallax correctly — `x` comes from the autonomous animation, `y` comes from the parallax. They do not fight.

### Reduced-motion handling
- Import `useReducedMotion` from Framer Motion.
- When true, skip the autonomous drift entirely (render rectangles at their static positions). Keep the scroll parallax — it's user-initiated.

### Dashboard dimming hook
When a chip is selected and the user is viewing the dashboard, the whole background (topography + masks) should feel *quieter*. For now, implement that by:
- Expose a CSS class on `<body>` that the app can toggle: `body.dashboard-active` reduces `.mask-layer-stack` opacity to `0.4` of its normal value with a 400ms transition.
- Add a matching class on the root `div` of this component: `className="mask-layer-stack transition-opacity duration-[400ms]"`.
- The parent app will add `dashboard-active` to `<body>` when a chip is picked. You do not implement that logic here — just make sure your component *responds* to the class being present.

---

## Where it gets mounted

In `app/layout.tsx`, add after the `<EtchedTopography />` line:

```tsx
import { MaskLayerStack } from '@/components/background/mask-layer-stack';

<body>
  <EtchedTopography />
  <MaskLayerStack />
  {children}
</body>
```

Order matters — topography first (lower z), then mask stack, then content.

---

## Performance notes

- 20 rectangles × `useTransform` is cheap but not free. Use `will-change: transform` on the motion divs.
- Use `transform: translate3d(...)` under the hood (Framer Motion does this by default when animating `x`/`y`).
- Do not animate `top`/`left` — only `x`/`y` transforms.
- When a chip is selected and `dashboard-active` is on body, CSS can also set `animation-play-state: paused` on the autonomous drift animations to stop unnecessary work.

---

## Acceptance checklist

- [ ] Component file at `components/background/mask-layer-stack.tsx`, client component.
- [ ] TypeScript strict, no `any`.
- [ ] No new deps.
- [ ] 20 rectangles generated from a seeded PRNG (seed 137). SSR + client render identically. No hydration warning.
- [ ] Each rectangle has rounded corners, thin stroke, no fill, tiny rotation.
- [ ] Opacity scales with depth: deepest ~4%, frontmost ~14%.
- [ ] Autonomous horizontal drift runs at different speeds per rectangle. Alternating directions. Never in unison.
- [ ] Scroll down → front rectangles move up faster than back ones. Clear depth effect.
- [ ] `prefers-reduced-motion: reduce` → no drift, parallax still works.
- [ ] Adding `dashboard-active` class to `<body>` → mask stack fades to 40% opacity with smooth transition.
- [ ] Lighthouse performance score on the home page does not drop more than 3 points after adding this.
- [ ] On mobile (375px wide), rectangles still look intentional — not a solid color or chaotic mess.
- [ ] Readable contrast for all foreground text is preserved.

---

## Anti-patterns

- ❌ Do not blur the rectangles. Blurring is expensive and we want crisp edges — masks are *photographs*, not clouds.
- ❌ Do not randomize rotation per-frame. Once at mount. Rotation is an attribute, not a motion axis here.
- ❌ Do not use Framer Motion `layout` prop on these — unnecessary and CPU-heavy.
- ❌ Do not put drop shadows on the rectangles. Kills performance and looks like UI cards.
- ❌ Do not couple to scroll position for x-drift. Autonomous is autonomous; parallax is parallax.
- ❌ Do not animate the rectangle count (adding/removing on scroll, etc). 20 fixed, that's it.

---

## Why this design

The mask-layer stack is the *idea* of the site made visual. Every chip the user picks is, physically, a stack of ~85 of these. The background doesn't need to literally depict that — it just needs to feel like you're peering into a laminate of transparent geometry. The autonomous drift reminds the viewer it's a living system; the scroll parallax reveals depth they didn't know was there.

Combined with the etched topography below, the effect should be: "I'm looking at something manufactured, delicate, and measured." That's the mood the numbers need to land in.
