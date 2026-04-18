# PROMPT_03 — Wafer Orbit (Chip Picker Presentation)

Paste this into Claude Code / Copilot Chat / Cursor after the chip picker basic layout exists (Phase 2.2 of PLAN.md). **This is not a background layer** — it's an interactive foreground component that visualizes the currently-considered chip being manufactured on a wafer.

---

## Context (read before coding)

- Read `AI_RULES.md`, `SKILLS.md`, `ARCHITECTURE.md` first.
- Read `data/chips.json` and `components/chip-picker.tsx` so you understand the chip data shape and how the picker currently works.
- Read `lib/compute.ts` to understand how `diesPerWafer` is computed — you will use that value directly.

Unlike the background animations, this one is **functional**. It communicates real data (die size → dies per wafer) and reacts to the user's selection.

---

## What to build

Create `components/wafer-orbit.tsx` — an SVG component that shows a 300mm silicon wafer viewed from above, with rectangular die outlines drawn on it at the *correct size ratio* for the currently-selected or hovered chip. Dies light up **sequentially in a radial sweep pattern from the center outward**, giving the impression that the wafer is being manufactured die-by-die in real time.

The wafer becomes the canvas on which every chip in the dataset is judged. An Apple A18 Pro (105 mm²) shows ~486 dies cascading outward in a rapid, dense sweep. An NVIDIA H100 (814 mm²) shows ~51 huge dies lighting up ring by ring, more deliberately. The visual contrast — many small lights vs few big lights, over the same 6 seconds — *is* the environmental story: a big die wastes more wafer per good chip. The sequential light-up makes that story feel like a process unfolding, not a static diagram.

**Visual character:** clean, technical, reminiscent of a foundry wafer map. Round wafer outline, a notch at the bottom (standard 300mm convention), neat rectangular dies laid out in a grid with small scribe lines between them. Dies are "off" (faint outline only) until the sweep reaches them, then light up and stay lit until the sweep completes — then the whole wafer dims and the sweep restarts.

**Motion character:** the sweep follows a **radial pattern from the center outward**, expanding in concentric rings. Total sweep duration: ~6 seconds regardless of chip (small-die chips feel fast-and-dense; large-die chips feel slow-and-deliberate — this *is* the story). After completing, pause 1 second at full wafer lit, then dim all dies over 500ms, then restart. On top of the sweep, the whole wafer rotates slowly — 1 full rotation every 90 seconds. When a chip is selected, rotation continues but the sweep holds at "fully lit" with a gentle pulse.

---

## Exact specification

### Placement
- Lives *inside* `components/chip-picker.tsx`, positioned as the focal element the chip cards arrange around. On desktop, it sits centered above the grid of cards. On mobile, it appears above the card list at smaller size.
- Size: `min(480px, 90vw)` square.
- Not `fixed`, not a background layer — a normal block-level component.

### Wafer outline
- SVG viewBox `0 0 500 500`. The wafer is a circle centered at `(250, 250)` with radius `220`.
- Notch: a small isosceles triangle cut into the bottom of the circle at `(250, 470)`, 10px wide by 6px deep. Use an SVG `<path>` combining the circle arc and the notch for a single outlined shape.
- Stroke: `var(--color-wafer-outline, oklch(0.55 0.02 250))`, 1.5px, with a very low-alpha fill like `oklch(0.97 0.005 250 / 0.4)`.

### Die grid
- Compute die rectangle size from the chip's `dieAreaMm2`:
  - Assume a square-ish die: `dieSideMm = sqrt(dieAreaMm2)`. (Close enough for visualization; real dies are rectangular but the ratios don't matter for the story.)
  - Scale: `1 mm = 220 / 150 px` (so 150 mm half-wafer maps to 220 px radius).
  - `dieSidePx = dieSideMm * scale`.
- Lay out dies in a grid starting from the center, spaced by `dieSidePx + 2px` scribe line.
- Only draw a die rectangle if its *entire* footprint fits within the wafer circle (corner-distance from center < radius − 2).
- Total die count on screen should visibly match `computeFootprint(chip).diesPerWafer` (candidate dies, before yield loss).
- **Compute each die's distance from wafer center** — you need this to order the sweep.
- **Bucket dies into concentric rings** of `dieSidePx` width. Ring 0 = dies within 1 die-width of center. Ring N = outermost dies. Store the ring index on each die at grid generation time.

### Die states (three)

Each die has three visual states driven by the sweep animation:

**OFF** (sweep hasn't reached it yet, or wafer just dimmed):
- `fill: oklch(0.92 0.01 250 / 0.3)` — very faint
- `stroke: oklch(0.55 0.02 250 / 0.5)`, 0.6px
- `opacity: 0.5`

**LIT** (sweep has passed; stays in this state until the whole wafer completes):
- `fill: var(--color-accent, oklch(0.65 0.12 170))`
- `stroke: oklch(0.35 0.1 170)`, 0.8px
- `opacity: 1`
- **Glow** via `filter: drop-shadow(0 0 3px oklch(0.65 0.12 170 / 0.6))` — but **only on dies in the currently-transitioning ring**. This prevents a bloom across all 486 dies, which would be ugly and slow.

**LOCKED** (chip is selected — the user has committed):
- Same fill and stroke as LIT
- Gentle `opacity: 1 → 0.85 → 1` pulse at 2-second cycle, infinite
- No glow; pulse alone is enough

### Sweep animation — the critical piece

Drive the sweep with a **single animated value** (`sweepRing` — a Framer Motion `MotionValue`) and derive per-die state from it. Do NOT animate 486 elements individually.

**Strategy:**
1. Group dies into concentric rings as described above. Number of rings ≈ `radius / dieSidePx` (roughly 15 for H100, 35 for A18 Pro).
2. Create one `useMotionValue(0)` for `sweepRing`.
3. Use Framer Motion's `animate()` function to drive it:
   - Phase 1 (expand): `animate(sweepRing, numRings, { duration: 6, ease: 'linear' })`
   - Phase 2 (hold): wait 1000ms
   - Phase 3 (dim): `animate(sweepRing, -1, { duration: 0.5, ease: 'easeIn' })`
   - Loop back to phase 1.
   - Orchestrate with async/await inside a `useEffect`. Cancel the animation on unmount or chip change.
4. Render pass: for each die, compute `isLit = die.ring <= currentSweepRing` (read the motion value's current value once per frame via `useMotionValueEvent`). Update the die's class or fill based on that.
5. Active-ring tracking for the glow: compute `activeRing = Math.floor(currentSweepRing)` on each frame; apply the drop-shadow filter only to dies where `die.ring === activeRing`.

**Implementation hint:** the cleanest React pattern is to track `litRingIndex` in `useState`, updated via `useMotionValueEvent(sweepRing, 'change', (v) => setLitRingIndex(Math.floor(v)))`. This gives you a single re-render per ring boundary crossing, not per frame — roughly 35 re-renders over 6 seconds for A18 Pro. That's cheap.

**When chip is LOCKED:** cancel any running animation and set `sweepRing.set(numRings)` so everything stays lit. Apply the pulse via a separate CSS animation class on the die group.

### Wafer rotation
- The entire wafer group (`<g>`) rotates continuously at all times: 360° over 90 seconds, linear, infinite.
- Rotation runs regardless of sweep state or selection. Slow enough that users barely notice unless they watch for it.
- Sweep and rotation are orthogonal: sweep is radial/temporal, rotation is angular/spatial. They do not interact.
- Drive rotation via Framer Motion on the outer `<motion.g>`, separate from the sweep logic.

### Reacting to picker state

Component receives two props:
```tsx
interface WaferOrbitProps {
  chip: Chip;            // the chip to render the die grid for (hovered or selected)
  isSelected: boolean;   // whether this is a locked-in selection
}
```

When `chip` changes:
- Cancel the current sweep animation.
- Fade out the current die grid over 200ms.
- Regenerate the grid for the new chip (including the ring bucketing).
- Reset `sweepRing` to `-1` (all off).
- Fade in the new grid over 200ms.
- Start a fresh sweep cycle from the center.

Use `AnimatePresence` with `key={chip.id}` on the outer die-group `<g>` to drive the fade cleanly — do not morph between die counts.

### Labels
- At the bottom of the SVG (below the notch), render two small text labels:
  - `"300mm wafer"` — static label, always visible.
  - `"{diesPerWafer} candidate dies · yield {yieldPercent}%"` — dynamic, tied to current chip. Monospace font (`JetBrains Mono`, already in the project).
- Text color: `oklch(0.45 0.02 250)`. Size: 11px. Centered under the wafer.

### Reduced motion
- `useReducedMotion()` → render all dies in LIT state permanently, no sweep, no rotation, no pulse. The component is still informative because die count and relative size are the core message.

---

## Integration into chip-picker.tsx

You will need to edit `components/chip-picker.tsx`:
- Add `const [hoveredChip, setHoveredChip] = useState<Chip | null>(null)`.
- `selectedChip` comes from URL state (`useSearchParams`) — you already have that.
- The current `chip` shown on the wafer: `hoveredChip ?? selectedChip ?? chips[0]`.
- Wire `onMouseEnter` / `onMouseLeave` / `onFocus` / `onBlur` on each chip card to set/clear `hoveredChip`.
- Render `<WaferOrbit chip={currentChip} isSelected={!!selectedChip && !hoveredChip} />` above the card grid.

---

## Performance requirements

- Total die count can reach ~500 for small-die chips. 500 SVG `<rect>` elements is fine. **500 Framer Motion components is not.** Use plain `<rect>` elements; drive state via the single shared motion value described above.
- Use `React.memo` on the per-die component if you extract one, so only dies whose state changed re-render.
- Drop-shadow filters are GPU-friendly but scale with count — limit to the ~30 dies in the active ring at any moment.
- **Benchmark target:** on a mid-range laptop, this component stays at 60fps with A18 Pro loaded. If it drops below 55fps, drop the drop-shadow glow and ship without it. Do not ship at 30fps.

---

## Acceptance checklist

- [ ] Component at `components/wafer-orbit.tsx`, client component, TS strict, no `any`.
- [ ] Renders a circular wafer with the notch at the bottom.
- [ ] Die grid size visibly changes between chips — H100 shows dramatically fewer, larger dies (~50) than A18 Pro (~480).
- [ ] Dies light up in concentric rings from center outward, over ~6 seconds.
- [ ] After the sweep completes, all dies glow for 1s, then dim, then the sweep restarts.
- [ ] The drop-shadow glow appears only on the *currently transitioning* ring, not on all lit dies.
- [ ] Wafer rotates continuously at ~90s per revolution, independent of sweep.
- [ ] Selecting a chip freezes the sweep at "all lit" with a gentle 2s-cycle pulse; rotation continues.
- [ ] Hovering a chip card in the picker → wafer switches to that chip's die grid within 400ms (fade out + fade in).
- [ ] Reduced-motion users see all dies permanently lit, no rotation, no sweep — still informative.
- [ ] Labels at the bottom show wafer size and current die count + yield, in monospace.
- [ ] Keyboard focus on a chip card triggers the same hover switch (focus = hover for accessibility).
- [ ] Mobile (375px): wafer scales down, sweep still visible, labels remain readable.
- [ ] Frame rate stays at 60fps on mid-range hardware with A18 Pro loaded (~480 dies).
- [ ] No Lighthouse accessibility regressions.
- [ ] No console errors, no hydration warnings.

---

## Anti-patterns

- ❌ Do not render each die as a `<motion.rect>`. 486 motion components = main-thread disaster. One shared motion value, 486 plain `<rect>` elements.
- ❌ Do not use `setInterval` or `setTimeout` to drive the sweep. Use Framer Motion's `animate()` or `useMotionValue` + `useMotionValueEvent`.
- ❌ Do not apply drop-shadow to every lit die simultaneously. Shadow bloom across 486 elements will tank performance and look like a blur.
- ❌ Do not depict real circuit detail inside each die. They're small solid rectangles. Fake internal traces are ugly and slow.
- ❌ Do not tie wafer rotation or sweep to scroll. This is a focal element, not a background.
- ❌ Do not make the wafer 3D (no perspective, no tilt). 2D top-down, clinical.
- ❌ Do not change wafer size when chip changes. The wafer is always 300mm — that's the whole point.
- ❌ Do not include a legend or tooltip on the dies themselves. The bottom label is sufficient.
- ❌ Do not sweep linearly across (left-to-right, top-to-bottom). It must be radial from center. Radial is the on-theme choice — real fab yield maps are read this way and testing proceeds in concentric patterns.
- ❌ Do not randomize sweep order within a ring. All dies in the same ring light up at the same instant. Deterministic ring-based ordering matches real fab yield-map conventions.
- ❌ Do not re-render the component on every frame. Use `useMotionValueEvent` with a derived `litRingIndex` state so React only re-renders when the ring index actually changes (~35 times in 6 seconds, not 360).

---

## Why this design

The sequential light-up is the app's most literal visual argument. The user watches 486 tiny dies cascade into existence for an A18 Pro in 6 seconds, then picks an H100 and watches 51 huge dies light up one ring at a time over the same 6 seconds. Without a single word of explanation, they now understand: bigger dies mean fewer chips per wafer, and the wafer is finite. That intuition is the foundation for every environmental number the app will show next.

The radial-from-center sweep is on-theme in a way a left-to-right sweep is not: semiconductor yield maps are read radially (center dies tend to have better yield than edge dies, for physical reasons), and wafer testing also proceeds in concentric patterns. An engineer looking at the animation will recognize it as something real, not arbitrary motion design.
