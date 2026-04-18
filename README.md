# Fab Footprint

**The hidden environmental cost of manufacturing a semiconductor chip.**

Fab Footprint is an interactive web app that reveals how much water, energy, and greenhouse gas emissions go into manufacturing a single semiconductor chip — from an Apple A18 Pro to an NVIDIA H100. Every number is backed by a cited source, and Google Gemini generates plain-English explanations and answers follow-up questions grounded in the data.

Built for the [DEV Weekend Challenge: Earth Day Edition](https://dev.to/challenges/earthday) — **Best Use of Google Gemini**.

## Features

- **23 chip presets** spanning consumer, data-center, AI-accelerator, and edge processors
- **4 environmental metrics** per chip: water, energy, GHG emissions, and fluorinated gas (PFAS) emissions
- **Interactive process breakdown chart** showing which manufacturing steps contribute most
- **Google Gemini explanations** that make the numbers intuitive with real-world comparisons
- **Grounded Q&A** — ask questions about any chip's footprint
- **Deep-linkable** — share `/?chip=h100` to load that chip's dashboard
- **Citations for every number** — click any metric tile to see the sources
- **Methodology page** explaining derivation and calibration
- **On-demand data refresh** — update `data/chips.json` or `data/sources.json`, then hit `/api/revalidate` to see changes instantly without a rebuild

## Chip Roster

| Chip | Node | Year |
|---|---|---|
| Apple A18 Pro | N3E (TSMC) | 2024 |
| Apple A17 Pro | N3B (TSMC) | 2023 |
| Apple M4 | N3E (TSMC) | 2024 |
| Apple M3 Max | N3B (TSMC) | 2023 |
| NVIDIA H100 (GH100) | N4 / 4N (TSMC) | 2022 |
| NVIDIA Blackwell GB202 | N4P (TSMC) | 2024 |
| NVIDIA AD102 (RTX 4090) | N4 / 4N (TSMC) | 2022 |
| AMD Zen 4 CCD | N5 (TSMC) | 2022 |
| AMD Instinct MI300X | N5 / N6 (TSMC) | 2023 |
| AMD 3D V-Cache SRAM Die | N7 (TSMC) | 2023 |
| Qualcomm Snapdragon 8 Gen 3 | N4P (TSMC) | 2023 |
| Qualcomm Snapdragon X Elite | N4P (TSMC) | 2024 |
| Google Tensor G4 | 4LPP+ (Samsung) | 2024 |
| Google TPU v5p | N4 (TSMC, est.) | 2023 |
| MediaTek Dimensity 9300 | N4P (TSMC) | 2023 |
| Samsung Exynos 2400 | 4LPP+ (Samsung) | 2024 |
| Intel Core Ultra (Meteor Lake) Compute Tile | Intel 4 (7nm EUV) | 2023 |
| Intel Core i9-13900K (Raptor Lake-S) Compute Die | Intel 7 (10nm ESF) | 2022 |
| Intel Core i7-12700H (Alder Lake-P) | Intel 7 (10nm ESF) | 2022 |
| Tesla D1 Dojo | N7 (TSMC) | 2022 |
| Cerebras WSE-3 | N5 (TSMC) | 2024 |

Plus two IMEC-calibration reference dies (N28 / N2).

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui**
- **Recharts** for charts, **Framer Motion** for animations
- **Google Gemini** (`gemini-2.5-flash`) via `@google/generative-ai`
- **Zod** for runtime data validation
- Deployed on **Vercel**

## Run Locally

```bash
git clone https://github.com/YOUR_USERNAME/fab-footprint.git
cd fab-footprint
npm install

# Add your Gemini API key
cp .env.example .env.local
# Edit .env.local: GEMINI_API_KEY=your_key_here

npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app works without a Gemini key — numbers and charts still show. AI features require a valid key.

## Refreshing Data Without a Rebuild

JSON data files in `data/` are loaded at request time (not bundled). After editing `chips.json`, `processes.json`, or `sources.json`, call the revalidate endpoint to flush the in-process cache:

```bash
# No secret configured (local dev / private deployment)
curl -X POST http://localhost:3000/api/revalidate

# With REVALIDATE_SECRET set in .env.local
curl -X POST http://localhost:3000/api/revalidate \
     -H "x-revalidate-secret: your-secret"
```

Reload any page and the updated data will appear. To protect the endpoint in production, add `REVALIDATE_SECRET=<random-string>` to your environment variables.

## Validate / Calibrate Data

`validate.py` (workspace root) runs a sanity-check against IMEC published anchors:

```bash
cd ..  # from fab-footprint/
python3 validate.py
```

It prints per-wafer and per-die footprints for every chip, then validates that the N2 reference die is within expected range of IMEC's published figures. Run this after editing data files.

## Data Sources

| Source | What it provides |
|---|---|
| **IMEC / Bardon et al., IEDM 2020** | Per-wafer scaling ratios N28→N2 |
| **IMEC / Gallagher, Semiconductor Digest 2025** | N2 ≈ 1,600 kg CO₂eq/wafer |
| **Hu et al., ScienceDirect 2023** | Industry-average water/energy/GHG per cm² |
| **Pirson et al., Carbon Management 2023** | Fluorinated gas emissions |
| **TSMC 2024 Sustainability Report** | Water recycling, RE targets |
| **US EPA F-Gas Partnership** | F-gas types and abatement |

31 total citations stored in `data/sources.json` and rendered on the Methodology page.

## Disclaimers

- **Illustrative estimates** for public education, not audit-grade.
- Shows **gross process water** (not net after recycling) and **front-end-of-line only**.
- Not suitable for regulatory reporting or foundry comparisons.

## Contributing Chip Data

Want to add a chip? Contributions to the dataset are welcome.

1. **`data/chips.json`** — add a new entry to the `chips` array. Required fields: `id`, `name`, `vendor`, `nodeNm`, `nodeFamily`, `dieAreaMm2`, `estimatedMaskCount`, `launchYear`, `powers`, `yieldAssumption`, `processMix`. Every number should come from a verifiable public source (datasheet, teardown, academic paper, or official report).

2. **`data/processes.json`** — only needed if your chip uses a process step not already listed. Add the process with per-step-per-wafer coefficients and a `sourceId`.

3. **`data/sources.json`** — add a source entry for every `sourceId` you reference in the chip or process entries. Include `title`, `org`, `year`, `url`, and `accessedOn`.

Run `python3 data/validate.py` to check your numbers are internally consistent before submitting.

Open a PR and I'll review the data and sources before merging.

## License

MIT — see [LICENSE](LICENSE).
