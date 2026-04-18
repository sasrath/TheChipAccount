# PLAN.md — Fab Footprint

Weekend build plan. Submission deadline: **Mon Apr 20, 12:29 PM IST.**

Today is Friday, Apr 17. We have roughly 72 hours but realistically ~25–30 productive hours. Plan is aggressive but cut-able — phases 1–3 are MVP, phase 4 is polish, phase 5+ are stretch.

Each task is small enough that an AI assistant can do it in one sitting. Commit after each.

---

## Phase 0 — Repo bootstrap (target: 45 min)

- [ ] `pnpm create next-app@latest fab-footprint --typescript --tailwind --app --src-dir=false --import-alias "@/*"`
- [ ] Initialize git, push to GitHub (public repo).
- [ ] Add `AI_RULES.md`, `SKILLS.md`, `PRD.md`, `ARCHITECTURE.md`, `PLAN.md` to repo root (these docs).
- [ ] `pnpm add framer-motion recharts zod lucide-react @google/generative-ai`
- [ ] `pnpm dlx shadcn@latest init` — choose default style, neutral color.
- [ ] `pnpm dlx shadcn@latest add button card dialog input tabs tooltip sheet skeleton badge scroll-area`
- [ ] Create `.env.example` with `GEMINI_API_KEY=`. Add `.env.local` (gitignored).
- [ ] `next.config.ts`: enable `serverExternalPackages: ['@google/generative-ai']` if needed.
- [ ] `tsconfig.json`: ensure `"strict": true`.
- [ ] Commit: `chore: bootstrap Next.js project with docs and deps`.

**Exit criteria:** `pnpm dev` runs a blank page with no errors, docs visible on GitHub.

---

## Phase 1 — Data layer (target: 3–4 hours)

This is the hardest phase because the numbers need to be real and cited. Don't skip the sourcing work — it's what makes the submission credible.

### 1.1 Schemas
- [ ] `lib/schemas.ts`: Zod schemas for `Chip`, `ProcessMixItem`, `Process`, `Source`. Export inferred types from them.
- [ ] `lib/types.ts`: re-export the inferred types + the `ComputedFootprint` composite.

### 1.2 Sources
- [ ] `data/sources.json`: at least 6 sources from the list in `SKILLS.md` §External data sources. Each: id, title, org, year, URL, accessedOn, type.
- [ ] Cross-check each URL loads.

### 1.3 Processes
- [ ] `data/processes.json`: coefficients for at least these process families (one representative entry each, more if data is available):
  - `euv-litho` (lithography)
  - `duv-litho` (lithography)
  - `plasma-etch` (etch — high PFAS contribution)
  - `wet-clean` (clean — high water contribution)
  - `pvd` (deposition)
  - `cvd-ald` (deposition)
  - `cmp` (CMP — your expertise, make this entry the best-sourced)
  - `implant` (implant)
  - `metrology` (metrology — very small contribution)
- [ ] Each entry: `perStepPerWafer` with water/energy/GHG/PFAS, each with `sourceId` and `confidence`.

### 1.4 Chips
- [ ] `data/chips.json`: 6–8 chips with realistic `processMix`.
  - Apple A18 Pro (N3E, ~109 mm²)
  - NVIDIA H100 (N4, ~814 mm²)
  - AMD EPYC Genoa chiplet (N5, ~72 mm² per CCD)
  - HBM3 stack (DRAM, ~80 mm² per die × 8)
  - Qualcomm Snapdragon 8 Gen 3 (N4P, ~115 mm²)
  - Generic "2nm logic die, 100 mm²" placeholder
- [ ] Each: processMix step counts calibrated to published mask counts (e.g. N3 ~ 85–90 masks total; EUV layers ~ 15–20).

### 1.5 Validation + compute
- [ ] `lib/data.ts`: load + validate at module load. Export `getChip`, `listChips`, `getProcess`, `getSource`.
- [ ] `lib/compute.ts`: implement the aggregation formula from `ARCHITECTURE.md` §5. Pure functions. Export `computeFootprint(chip): ComputedFootprint`.
- [ ] `lib/comparisons.ts`: helper functions like `waterToBathtubs(l: number): string`, `energyToACHours(kwh: number): string`, `ghgToCarKm(kg: number): string`. India-relatable where possible.
- [ ] Smoke test via a temporary `scripts/check.ts` that computes one chip and prints the result. Delete after verifying.

**Exit criteria:** computing an A18's footprint returns plausible, cited numbers. No `any` types. Zod catches at least one deliberately-broken test case.

---

## Phase 2 — Core UI (target: 4–6 hours)

### 2.1 Layout + theme
- [ ] `app/layout.tsx`: Inter + JetBrains Mono fonts, `MotionConfig` with `reducedMotion="user"`, metadata for OG card.
- [ ] `app/globals.css`: Tailwind entrypoint, CSS vars for a calm earth-tone palette (consider: deep green, warm off-white, muted clay accent; avoid cliché "leaves everywhere" greenwashing). Consult `skills/public/frontend-design` if time.
- [ ] Design tokens committed to Tailwind config.

### 2.2 Landing + chip picker
- [ ] `app/page.tsx` server component: hero ("What does it cost the planet to make this chip?") + `<ChipPicker>`.
- [ ] `components/chip-picker.tsx` client: reads `chips` via a server-passed prop, renders a grid of `<ChipCard>`.
- [ ] `components/chip-card.tsx` client: Framer Motion hover, keyboard-focusable, clicking sets `?chip=<id>` in the URL via `useRouter`.

### 2.3 Dashboard
- [ ] `app/page.tsx` reads `chip` search param server-side. If set, renders `<Dashboard>` below the picker (or replaces it on mobile).
- [ ] `components/dashboard.tsx` server: layouts header + metric tiles + chart + explain panel + chat.
- [ ] `components/metric-tile.tsx` client: big number, unit, comparison line, confidence badge, click → opens citation sheet.
- [ ] `components/citation-sheet.tsx` client: shadcn Sheet listing all sources backing that metric.

### 2.4 Process chart
- [ ] `components/process-chart.tsx` client: Recharts horizontal bar chart, one bar per process family. Tab selector for metric (water / energy / GHG / PFAS).
- [ ] Framer Motion stagger on first reveal.
- [ ] Dynamic import Recharts to keep landing lean.

**Exit criteria:** Deep-linking to `/?chip=a18` shows a fully working dashboard with real numbers and a working chart. Mobile layout is usable at 375px.

---

## Phase 3 — Gemini integration (target: 3–4 hours)

### 3.1 Gemini wrapper
- [ ] `lib/gemini.ts`: thin wrapper around `@google/generative-ai`. Exposes `streamExplain(chipData)` and `streamChat(chipData, history, question)`.
- [ ] `lib/prompts/explain.ts`: builder returning the exact system instruction + user message for F3.
- [ ] `lib/prompts/chat.ts`: same for F4.

### 3.2 API routes
- [ ] `app/api/explain/route.ts`: `POST`, body `{ chipId }`, streams plain text. Rate limit + Zod-validate input.
- [ ] `app/api/chat/route.ts`: `POST`, body `{ chipId, history, question }`, streams plain text. Same guards.
- [ ] `lib/rate-limit.ts`: token bucket / sliding window, 10 req / 60s / IP.

### 3.3 Client wiring
- [ ] `components/explain-panel.tsx` client: auto-fires on mount, renders streaming text, has regenerate button, handles error state (Gemini down → friendly fallback).
- [ ] `components/chat.tsx` client: input + message list, streams responses, keyboard-submits, disabled state while streaming.

**Exit criteria:** Switching between chips triggers a new Gemini explanation that references the right numbers. Asking "why does EUV use so much energy for this chip?" returns a grounded answer that cites numbers from the data.

---

## Phase 4 — Methodology, polish, deploy (target: 3–4 hours)

- [ ] `app/about/page.tsx` OR `components/methodology-modal.tsx`: explain the compute model, caveats, known unknowns, source list.
- [ ] Footer: link to methodology, GitHub repo, DEV challenge page, your DEV profile.
- [ ] OG image: generate `public/og-image.png` (1200×630). Simple: app name + tagline + one metric number. Use Figma, Canva, or an SVG you export.
- [ ] `metadata` exports on `app/layout.tsx` + `app/page.tsx`: title, description, OG image, Twitter card.
- [ ] Loading skeletons on `<ExplainPanel>` and `<Chat>`.
- [ ] `prefers-reduced-motion` respected globally (confirm via DevTools emulation).
- [ ] Lighthouse pass: ≥90 accessibility, ≥85 performance on mobile.
- [ ] `README.md`: project pitch, screenshots, run-locally steps, env var, source list, credits.
- [ ] Deploy to Vercel. Set `GEMINI_API_KEY`. Verify production works.
- [ ] Smoke test on iPhone Safari + Android Chrome.

**Exit criteria:** production URL works end-to-end, README is done, you could ship this as-is.

---

## Phase 5 — Submission post (target: 1.5 hours)

- [ ] Open DEV submission template from the challenge page.
- [ ] **What I Built**: 2–3 paragraphs. Lead with the motivation (chips-vs-planet conversation is loud, data is scattered). Explain the app concept. Name the submission as "Best Use of Google Gemini".
- [ ] **Demo**: embed a 30–60s Loom or a screen recording. Include the production URL.
- [ ] **Code**: embed the GitHub repo.
- [ ] **How I Built It**: tech stack, the grounding approach for Gemini, the sourcing discipline, how per-wafer → per-die math works, why streaming matters for UX.
- [ ] **Prize Categories**: Best Use of Google Gemini — explain the grounded-prompt design and show an example Q&A.
- [ ] Proof-read. Hit publish.

**Exit criteria:** post is live under the `devchallenge, weekendchallenge` tags, URL verified.

---

## Stretch / post-submission (only if everything above is done early)

- [ ] Compare-two-chips view (`/?chip=a18&compare=h100`).
- [ ] "Build your own chip" sliders (node, die size, mask count) computing live.
- [ ] Social share card with per-chip dynamic numbers.
- [ ] Vercel Analytics.
- [ ] Voice narration of the Gemini explanation via Web Speech API (use the browser's free TTS, not ElevenLabs — keep costs at zero).
- [ ] A "confidence" filter: hide low-confidence numbers.

---

## Cut-list (if running out of time)

In order of what to drop first:
1. OG image (use default).
2. About page (fold into a small inline methodology popover).
3. Citation sheet (show sources inline as tooltips instead).
4. Chat (F4) — keep only the explanation (F3). Still meets the Gemini category.
5. PFAS metric — merge into GHG.

**Do not cut:** the numbers-with-sources story, one Gemini integration, deploy.

---

## Decision log

Record significant decisions here as you go, so the submission post writes itself.

- 2026-04-17: Scope locked to Next.js + JSON + Gemini + Vercel. No DB, no auth.
- 2026-04-17: Chose grounded-prompt Gemini over function-calling / tool-use — simpler and sufficient for the scope.
- 2026-04-17: PFAS kept as a separate metric (not folded into GHG) because its persistence story is lost inside a CO₂e number.
- 2026-04-17: Default yield assumption 0.7 when specific data is unavailable; disclosed in methodology.

---

## Daily checkpoints

| When | Phase target | Red-line |
|---|---|---|
| Fri Apr 17, end of day | Phase 0 + start Phase 1 | If data sourcing isn't done, cut to 5 chips. |
| Sat Apr 18, mid-day | Phase 1 done | If still fighting data, stub 2 chips with "estimated" flags and move on. |
| Sat Apr 18, end of day | Phase 2 mostly done | If chart doesn't work, ship a table instead. |
| Sun Apr 19, mid-day | Phase 3 done | If chat (F4) is buggy, ship only explain (F3). |
| Sun Apr 19, end of day | Phase 4 done, deployed | Post-writing starts here at the latest. |
| Mon Apr 20, 10:00 IST | Phase 5 done, submitted | Hard stop. |
