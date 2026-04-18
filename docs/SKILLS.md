# SKILLS.md — Fab Footprint

The approved toolbox. If a task can be done with something in this list, use it. If it can't, stop and flag it (`// DEP-REQUEST:` comment) — don't freestyle a new dependency.

---

## Runtime & framework

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| Next.js | 15.x (App Router) | Framework |
| React | 19.x | UI library |
| TypeScript | 5.x | Language, strict mode |

**Why Next.js App Router:** server components keep the Gemini key server-side with zero ceremony, route handlers give us a clean `/api/**` surface, and Vercel deploy is one click.

---

## Styling & UI

| Tool | Version | Purpose |
|---|---|---|
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | latest | Component primitives (Button, Card, Dialog, Input, Tabs, Tooltip) |
| lucide-react | latest | Icons |
| Framer Motion | 11.x | Page transitions, chart reveals, hover effects |
| next/font | built-in | Inter (body), JetBrains Mono (numbers) |

**shadcn components to install (only these):**
`button`, `card`, `dialog`, `input`, `tabs`, `tooltip`, `sheet`, `skeleton`, `badge`, `scroll-area`.

**Framer Motion usage guardrails:**
- Page enter: simple `opacity` + `y` fade, 200–300ms.
- Chip-card hover: `scale: 1.02`, `y: -2`.
- Chart reveal: orchestrated with `staggerChildren` on bars/lines.
- Respect `prefers-reduced-motion` globally via a `MotionConfig` wrapper.
- No parallax, no scroll-jacking, no unnecessary physics.

---

## Data & charts

| Tool | Version | Purpose |
|---|---|---|
| Recharts | 2.x | Bar, line, and radial charts |
| Zod | 3.x | Runtime validation of JSON data files and Gemini tool outputs |

**Why Zod:** the JSON data files are hand-curated from PDFs and sustainability reports. Validating them at import time catches typos before they render wrong numbers.

---

## LLM

| Tool | Version | Purpose |
|---|---|---|
| `@google/generative-ai` | latest | Gemini SDK |
| Model: `gemini-2.5-flash` | — | Default model for explain + chat |
| Model: `gemini-2.5-pro` | — | Fallback for "deep dive" endpoint if needed |

**Not using:**
- LangChain / LlamaIndex — overkill for a weekend; direct SDK is clearer.
- Vercel AI SDK — nice, but adds a layer we don't need for two endpoints.

---

## Deployment & infra

| Tool | Purpose |
|---|---|
| Vercel | Hosting, CI/CD from GitHub main branch |
| GitHub | Source control, repo public for the DEV submission |
| `.env.local` | Local secrets (gitignored) |
| Vercel env vars | Production `GEMINI_API_KEY` |

---

## Dev tooling

| Tool | Purpose |
|---|---|
| pnpm | Package manager (faster installs on Mac Mini M4) |
| ESLint | Lint (`next/core-web-vitals` + `@typescript-eslint`) |
| Prettier | Format on save |
| TypeScript compiler | `tsc --noEmit` in pre-commit if time allows |

---

## Techniques / patterns we'll use

### 1. Typed JSON at build time
Import JSON directly, validate with Zod on first access, cache the parsed result in module scope. Example:

```ts
// lib/data.ts
import chipsRaw from '@/data/chips.json';
import { ChipsSchema } from '@/lib/schemas';

export const chips = ChipsSchema.parse(chipsRaw);
```

### 2. Streaming Gemini responses
Use `generateContentStream` and pipe through a `TransformStream` to the client. Gives the "ChatGPT feel" without fancy infra.

### 3. Grounded prompts
System instruction + JSON data blob + user question. Never rely on Gemini's training recall for numbers.

### 4. Comparison helpers
`lib/comparisons.ts` — pure functions converting raw numbers to relatable units ("2.3 L water = 12 bottles of Bisleri", "4.1 kWh = one AC-hour in Chennai summer"). Keep comparisons India-relatable since that's your audience.

### 5. Server actions for simple mutations
If any mutation is needed (unlikely — this app is read-only), use server actions over API routes.

---

## Techniques we're explicitly NOT using

- **No authentication.** No NextAuth, no Clerk, no Auth0. Public app.
- **No database.** No Postgres, no Supabase, no SQLite. JSON files only.
- **No state management library.** React's `useState` / `useContext` is sufficient.
- **No testing framework.** This is a 72-hour build. Manual QA via a checklist in `PLAN.md`.
- **No internationalization.** English only; DEV judges English submissions.
- **No analytics.** Add Vercel Analytics only if time permits in stretch phase.

---

## External data sources (for populating `data/*.json`)

These are the sources we'll cite. All public, freely readable.

1. **TSMC Sustainability Report (latest)** — water, energy, GHG per wafer numbers.
2. **Samsung Foundry ESG Report** — comparison data.
3. **SEMI Sustainability Initiative publications** — industry averages.
4. **IMEC SSTS (Sustainable Semiconductor Technologies & Systems)** — process-level LCA, especially EUV energy.
5. **Bardon et al., "DTCO including sustainability: Power-Performance-Area-Cost-Environmental score (PPACE) analysis"** (IEDM 2020) — per-layer environmental cost.
6. **IEA — Data centres and data transmission networks** — grid carbon intensity context.
7. **EPA / EU PFAS disclosures** — fluorinated gas usage in plasma etch.
8. **Ember / ElectricityMaps** — grid mix for Taiwan, Korea, Arizona (where fabs are).

Record each in `data/sources.json` with URL + access date. Paraphrase findings; never paste source text.

---

## What unlocks if time permits (stretch)

These are *not* in scope unless Phase 4 of `PLAN.md` is reached early:

- Compare-two-chips view.
- "Build your own chip" sliders (node, die size, mask count).
- Export-as-image share card for social.
- Vercel Analytics.
- Voice narration of the Gemini explanation via the Web Speech API (no ElevenLabs — keep it free).
