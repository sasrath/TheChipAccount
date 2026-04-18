# ARCHITECTURE.md — Fab Footprint

## 1. High-level picture

```
┌────────────────────────────────────────────────────────────┐
│                    Browser (Client)                        │
│                                                            │
│  Server Components          Client Components              │
│  ──────────────────         ──────────────────             │
│  app/page.tsx               components/chip-picker.tsx     │
│  app/[chip]/page.tsx        components/metric-tile.tsx     │
│  (reads data/*.json         components/process-chart.tsx   │
│   server-side, renders      components/explain-panel.tsx   │
│   static HTML)              components/chat.tsx            │
│                                    │                       │
│                                    │ fetch (stream)        │
└────────────────────────────────────┼───────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────┐
│              Next.js Route Handlers (Server)               │
│                                                            │
│   app/api/explain/route.ts   ──────┐                       │
│   app/api/chat/route.ts      ──────┤                       │
│                                    │                       │
│   • reads process.env.GEMINI_API_KEY                       │
│   • loads chip+process data server-side                    │
│   • builds grounded prompt                                 │
│   • streams Gemini response back                           │
│   • simple in-memory rate limit                            │
└────────────────────────────────────┼───────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │  Google Gemini API   │
                          │  (gemini-2.5-flash)  │
                          └──────────────────────┘
```

---

## 2. Directory layout

```
fab-footprint/
├── app/
│   ├── layout.tsx                # Root layout, MotionConfig, fonts
│   ├── page.tsx                  # Landing + chip picker (server component)
│   ├── globals.css               # Tailwind entrypoint + CSS vars
│   ├── api/
│   │   ├── explain/route.ts      # Streams the "Why these numbers?" text
│   │   └── chat/route.ts         # Streams grounded Q&A
│   └── about/
│       └── page.tsx              # Methodology page
│
├── components/
│   ├── chip-picker.tsx           # Client — grid of chip cards, handles selection
│   ├── chip-card.tsx             # Client — single card, Framer hover
│   ├── dashboard.tsx             # Server — orchestrates the per-chip view
│   ├── metric-tile.tsx           # Client — number + comparison + source popover
│   ├── process-chart.tsx         # Client — Recharts bar chart
│   ├── explain-panel.tsx         # Client — streamed Gemini explanation
│   ├── chat.tsx                  # Client — Q&A input + message list
│   ├── citation-sheet.tsx        # Client — side sheet listing sources
│   ├── methodology-modal.tsx     # Client — the "how we calculated this" modal
│   └── ui/                       # shadcn-generated primitives
│
├── lib/
│   ├── data.ts                   # Loads + Zod-validates chips/processes/sources
│   ├── schemas.ts                # Zod schemas for all data files
│   ├── compute.ts                # Pure functions: wafer → die, aggregate metrics
│   ├── comparisons.ts            # Pure functions: raw number → human comparison
│   ├── gemini.ts                 # Thin wrapper around @google/generative-ai
│   ├── prompts/
│   │   ├── explain.ts            # System + user prompt builders for F3
│   │   └── chat.ts               # System + user prompt builders for F4
│   ├── rate-limit.ts             # In-memory token bucket per IP
│   ├── log.ts                    # No-op in prod wrapper
│   └── types.ts                  # Shared TS types (derived from Zod schemas)
│
├── data/
│   ├── chips.json                # ~6–8 chip presets
│   ├── processes.json            # Per-process env cost coefficients
│   └── sources.json              # Citations
│
├── public/
│   ├── og-image.png              # Social share card (1200×630)
│   └── favicon.svg
│
├── .env.local                    # GEMINI_API_KEY=... (gitignored)
├── .env.example                  # Template
├── AI_RULES.md
├── SKILLS.md
├── PRD.md
├── ARCHITECTURE.md
├── PLAN.md
├── README.md
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── pnpm-lock.yaml
```

---

## 3. Data flow

### 3.1 Static rendering path (numbers)

1. User hits `/?chip=a18`.
2. `app/page.tsx` runs on the server. It calls `getChip('a18')` from `lib/data.ts`.
3. `lib/data.ts` imports `data/chips.json` + `data/processes.json` at module load, validates them with Zod once, and caches the parsed objects.
4. `lib/compute.ts` aggregates per-process coefficients into per-chip totals (water, energy, GHG, PFAS) using the chip's node, die size, mask count, and yield.
5. The server component passes the computed numbers + raw source ids to `<Dashboard>` and its children as props.
6. HTML is streamed to the browser. Numbers are visible immediately; no client-side data fetching.

### 3.2 Gemini explanation path (F3)

1. On dashboard mount, `<ExplainPanel>` (client) calls `POST /api/explain` with `{ chipId }`.
2. The route handler loads the same server data, builds a grounded prompt (system instruction + JSON data + request to produce a 2–3 paragraph explanation), and calls `gemini-2.5-flash` with streaming enabled.
3. The Gemini stream is piped through a `TransformStream` that forwards chunks as SSE / plain text stream to the client.
4. Client renders chunks as they arrive. On completion, result is kept in React state (no persistence).

### 3.3 Gemini chat path (F4)

1. User types a question, hits send.
2. Client `POST`s to `/api/chat` with `{ chipId, history: [...], question }`.
3. Route handler builds a grounded multi-turn prompt (system instruction re-asserts "answer only from the provided data"), includes the chip data, and streams back.
4. Client appends the streaming answer to the conversation list.

### 3.4 Rate limiting

- `lib/rate-limit.ts` exports `checkLimit(ip: string): { ok: boolean; retryAfterMs?: number }`.
- In-memory `Map<string, { count, windowStart }>`. Window = 60s, limit = 10.
- Called at the top of both API routes. On limit exceeded, return 429.
- Good enough for demo; not for production traffic.

---

## 4. Key data types

```ts
// lib/types.ts (generated via Zod inference)

export type Chip = {
  id: string;                    // 'a18'
  name: string;                  // 'Apple A18 Pro'
  vendor: string;                // 'Apple / TSMC N3E'
  nodeNm: number;                // 3
  nodeFamily: string;            // 'N3E'
  dieAreaMm2: number;            // 109
  estimatedMaskCount: number;    // ~87
  launchYear: number;            // 2024
  powers: string;                // 'iPhone 16 Pro'
  yieldAssumption: number;       // 0.7
  processMix: ProcessMixItem[];  // Which processes and how many steps of each
  notes?: string;
};

export type ProcessMixItem = {
  processId: string;             // 'euv-litho'
  stepCount: number;             // e.g. 12
};

export type Process = {
  id: string;                    // 'euv-litho'
  name: string;                  // 'EUV Lithography'
  family: 'lithography' | 'etch' | 'deposition' | 'cmp' | 'clean' | 'implant' | 'metrology';
  perStepPerWafer: {
    waterL: { value: number; sourceId: string; confidence: Confidence };
    energyKwh: { value: number; sourceId: string; confidence: Confidence };
    ghgKgCo2e: { value: number; sourceId: string; confidence: Confidence };
    pfasKg: { value: number; sourceId: string; confidence: Confidence };
  };
  notes?: string;
};

export type Confidence = 'high' | 'medium' | 'low' | 'estimated';

export type Source = {
  id: string;
  title: string;
  org: string;
  year: number;
  url: string;
  accessedOn: string;            // ISO date
  type: 'report' | 'paper' | 'dataset' | 'article';
};

export type ComputedFootprint = {
  chip: Chip;
  totals: {
    waterL: number;
    energyKwh: number;
    ghgKgCo2e: number;
    pfasKg: number;
    pfasGhgContributionKgCo2e: number;
  };
  byFamily: Record<string, Partial<ComputedFootprint['totals']>>;
  sourceIds: Set<string>;
};
```

---

## 5. Compute model (simplified)

Per-chip totals are computed as:

```
for each process in chip.processMix:
  per_wafer_value = process.perStepPerWafer[metric] * process.stepCount
  per_die_value   = per_wafer_value * (die_area / usable_wafer_area) / yield
  add to totals[metric]
```

Where:
- `usable_wafer_area` = area of a 300mm wafer minus edge exclusion, ~70,000 mm².
- `yield` = `chip.yieldAssumption`, default 0.7.

Kept simple and documented in the methodology modal. Anyone can open `lib/compute.ts` and see exactly what we did.

---

## 6. Prompt design

### Explain endpoint system instruction (abbreviated)

```
You are a clear, neutral science explainer writing for a general audience.

You will be given structured data about the manufacturing footprint of one
semiconductor chip. Your job: write 2–3 short paragraphs (under 180 words)
that make these numbers feel real.

Rules:
- Only use numbers from the provided data. Do not invent figures.
- If the data is missing something, say so.
- Use one concrete comparison per paragraph (e.g. "equivalent to X").
- Do not praise or criticize any company. Focus on the physics of the process.
- No marketing tone. No alarmism. Just clarity.
```

### Chat endpoint system instruction (abbreviated)

```
You are an assistant grounded in a specific dataset about chip manufacturing.

You have access to:
- the chip's metadata (node, die size, mask count, yield assumption)
- per-process environmental coefficients (water, energy, GHG, PFAS)
- the citations backing each number

Rules:
- Answer ONLY from the provided data and well-established semiconductor
  engineering facts (e.g. "EUV wavelength is 13.5nm" is fine).
- If the question is outside the data, say "I don't have that data for this
  chip" and suggest what data would answer it.
- Quote specific numbers when relevant.
- Keep answers under 150 words unless the user explicitly asks for depth.
```

Full versions live in `lib/prompts/*.ts`.

---

## 7. Error handling

| Failure | Behavior |
|---|---|
| Gemini API key missing | API routes return 500 with `{ error: 'LLM not configured' }`. UI shows a friendly "explanation unavailable" state. Numbers still visible. |
| Gemini rate limit / 429 | UI shows "try again in a moment"; numbers still visible. |
| Invalid `chipId` in URL | Server component redirects to `/`. |
| Zod validation fails at boot | Build fails loudly — we want this. Data files must be correct. |
| Client-side JS disabled | Dashboard numbers still render (server-rendered). Chat / explain won't work. Acceptable. |

---

## 8. Security notes

- `GEMINI_API_KEY` only in Vercel env + `.env.local`. Never in client code.
- No user input is stored. Chat history is in-memory, per-tab.
- API routes validate input with Zod before forwarding to Gemini. Reject oversized payloads (>8KB request body).
- Basic rate limit as described above.
- No CORS opened — API routes only called from our own origin.

---

## 9. Performance notes

- JSON data imports are tree-shaken; only the needed chip's data ships in the initial HTML.
- Recharts is heavy (~90KB gz). Dynamically import on the dashboard route only.
- Framer Motion is reasonably light; load normally.
- Fonts: `next/font` with `display: swap`, preload the body font only.
- Streaming responses for Gemini — first token arrives in ~500ms.

---

## 10. Deployment

1. Push to GitHub `main`.
2. Vercel picks up automatically.
3. Set `GEMINI_API_KEY` in Vercel project settings (Production + Preview).
4. Custom domain optional. `fab-footprint.vercel.app` is fine for submission.

---

## 11. Observability (bare minimum)

- `lib/log.ts` with `log.info`, `log.warn`, `log.error`. In production, goes to Vercel logs via `console.*`.
- Log: rate-limit hits, Gemini call duration, Gemini errors. Never log prompt contents (could contain user questions).
