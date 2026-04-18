# AI_RULES.md — Fab Footprint

Rules for any AI coding assistant (GitHub Copilot, Claude Code, Cursor, Continue, etc.) working in this repo. Read this before writing or editing code. Re-read when the task or file scope changes.

---

## Project identity (one-liner)

**Fab Footprint** is a weekend-scope Next.js web app for the DEV Weekend Challenge: Earth Day Edition. It lets a user pick a chip (e.g. Apple A18, HBM3 stack, NVIDIA H100, generic 3nm logic die), visualizes the hidden environmental cost of manufacturing it — water, energy, PFAS/GHG emissions, materials — and uses Google Gemini to generate a plain-English narrative and answer follow-up questions.

**Target prize categories:** Best Use of Google Gemini (primary). Overall winner (secondary).

**Submission deadline:** Monday, April 20, 2026, 12:29 PM IST. Treat every task as time-boxed.

---

## Non-negotiable rules

1. **Do not invent environmental numbers.** Every figure shown in the UI must come from `data/chips.json`, `data/processes.json`, or `data/sources.json`, each tied to a citation. If a number is missing, surface "estimated" or "unknown" in the UI — never fabricate a plausible-looking value.
2. **Gemini calls are server-side only.** Never put `GEMINI_API_KEY` in any file under `app/`, `components/`, or `public/`. Only `app/api/**/route.ts` may read `process.env.GEMINI_API_KEY`.
3. **No client-side secrets of any kind.** No `NEXT_PUBLIC_*` env vars for keys. If you're about to add one, stop.
4. **TypeScript strict.** `strict: true` in tsconfig. No `any` unless accompanied by a `// TODO(type)` comment explaining why. Prefer `unknown` + narrowing.
5. **No new dependencies without justification.** The approved list is in `SKILLS.md`. If you need something else, add a comment `// DEP-REQUEST: <pkg> because <reason>` and stop — don't install.
6. **Weekend scope discipline.** If a feature isn't in `PLAN.md` for the current phase, don't build it. Park it in a `// FUTURE:` comment or append to `PLAN.md` under "Stretch / post-submission".
7. **Accuracy > polish > features.** In that order. A small app with trustworthy numbers beats a big app with hand-wavy ones.
8. **Paraphrase, don't copy.** When pulling from sources (IMEC, SEMI, TSMC sustainability reports, academic papers), summarize in our own words. Never paste paragraphs. Attribute in `data/sources.json`.

---

## Tech stack (locked)

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Animation:** Framer Motion (use sparingly — page transitions, chart reveals, chip-card hover)
- **Charts:** Recharts
- **LLM:** Google Gemini via `@google/generative-ai` SDK, called from `app/api/**/route.ts`
- **Data:** static JSON files in `/data/` loaded at build time (no DB)
- **Deploy:** Vercel
- **Icons:** lucide-react
- **Linting/formatting:** ESLint (Next defaults) + Prettier

Do not swap any of the above without a written note in the PR description.

---

## Code style

- **File naming:** kebab-case for files (`chip-card.tsx`), PascalCase for React components, camelCase for functions/vars.
- **Server vs client components:** Server by default. Add `'use client'` only when you need state, effects, or browser APIs. Keep the `'use client'` boundary as narrow as possible — extract interactive bits into small leaf components.
- **Imports:** absolute imports via `@/*` alias. Group: (1) react/next, (2) third-party, (3) `@/` internal, (4) relative, (5) types.
- **Components:** one component per file. Co-locate small helpers. Export named, not default (except pages/layouts which Next requires default).
- **Props:** always type explicitly with a `Props` interface. No inline object types for props.
- **Comments:** explain *why*, not *what*. If the code is surprising (e.g. a specific unit conversion, a non-obvious Gemini prompt decision), leave a short comment with a source link.
- **Error handling in API routes:** always wrap in try/catch, return `NextResponse.json({ error }, { status })`. Never leak stack traces to the client.
- **No `console.log` in committed code.** Use a tiny `lib/log.ts` wrapper that no-ops in production.

---

## Gemini usage rules

- Model: `gemini-2.5-flash` by default (fast, cheap, generous free tier). Use `gemini-2.5-pro` only for the "deep dive" endpoint if flash quality is insufficient.
- **Always ground the model.** Every Gemini call must include the relevant chip/process data as structured context in the system instruction or prompt. Never ask Gemini to recall facts from its training.
- **Prompt structure:**
  1. System instruction: role + grounding rules + "if the data doesn't contain X, say you don't know."
  2. User message: the data blob (JSON) + the user's question.
- **Streaming:** use streaming responses for the chat/explainer endpoints so the UI feels snappy.
- **Rate limit protection:** basic in-memory rate limit on the API route (e.g. 10 requests / minute / IP). Good enough for demo day.
- **Safety:** keep default Gemini safety settings. Don't lower them.
- **Prompt files:** store prompts in `lib/prompts/` as exported template functions, not inlined in route handlers. Makes them reviewable.

---

## Data rules

- `data/chips.json` — list of chip presets with process node, die size, approximate mask count, and references to the processes they use.
- `data/processes.json` — per-process-step environmental cost coefficients (water L/wafer, kWh/wafer, kg CO2e/wafer, PFAS notes).
- `data/sources.json` — citation objects (`id`, `title`, `org`, `year`, `url`, `accessedOn`). Every number in the other two files carries a `sourceId`.
- All numeric values use SI units, documented in a comment at the top of each file.
- When adding a data point: include `sourceId`, `confidence` ("high" | "medium" | "low" | "estimated"), and a short `note`.

---

## UI / UX rules

- **One screen, progressive disclosure.** Landing → pick a chip → see the footprint dashboard → ask Gemini follow-ups. No multi-page navigation.
- **Numbers need context.** Every metric must show a comparison ("= X households' daily water"). Raw numbers alone are useless.
- **Accessibility baseline:** semantic HTML, keyboard nav works, color contrast AA, `prefers-reduced-motion` respected (disable Framer Motion transitions).
- **Mobile works.** Test at 375px width. Charts must be readable or gracefully degrade to a table.
- **No dark pattern greenwashing.** The app's point is to *show* the cost honestly. Don't frame the numbers as "it's not so bad" or "chip X is green." Neutral, factual tone.

---

## Git / commit rules

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `style:`.
- Commit after each completed task in `PLAN.md`. Small, reviewable commits.
- Never commit `.env*` files. `.env.example` only.
- Branch from `main`. For a solo weekend project, committing to `main` is fine.

---

## What to do when stuck

1. Re-read `PRD.md` — is this feature actually in scope?
2. Check `PLAN.md` — is this the phase we're in?
3. Check `ARCHITECTURE.md` — is there a pattern for this already?
4. If still stuck, add a `// BLOCKED:` comment describing the decision needed and move on. Don't guess on architecture.

---

## What to never do

- Ship without citations for numeric claims.
- Call Gemini from a client component.
- Add authentication, user accounts, or databases. (Out of scope.)
- Make this a crypto/NFT project. (Wrong theme, and we're not submitting to Solana.)
- Write copy that implies a specific chipmaker is "bad." We're showing industry-wide physics, not running a PR campaign.
- Ship on Sunday night without a `README.md` and a DEV submission post draft.
