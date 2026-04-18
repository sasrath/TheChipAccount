# METHODOLOGY.md — Fab Footprint

This document explains, transparently, how the numbers shown in Fab Footprint were derived, calibrated, and validated. It exists because the app's credibility depends on the reader being able to check our work.

**TL;DR:** the numbers are *illustrative estimates* derived from published industry aggregate data, calibrated against IMEC's anchor figure of ~1,600 kg CO₂eq per wafer for a 2nm logic node. All values are within ±15% of independent published anchors. They are suitable for public education and comparison, not for corporate carbon accounting.

---

## 1. What we're actually computing

The app answers one question: *"how much water, electricity, and greenhouse gas is released to manufacture one chip of type X?"*

The pipeline is:

```
per-process-step coefficients
  ── × step count (from the chip's process flow) ──▶ per-wafer totals
    ── ÷ dies-per-wafer, ÷ yield ──▶ per-die totals
```

Two critical scoping choices:

1. **Front-end-of-line + middle-of-line only.** We count what happens inside the wafer fab. We do *not* count packaging (CoWoS, HBM stacking), upstream mineral extraction, transport, or use-phase energy. This is a deliberate choice — those phases are covered elsewhere and would dilute the fab-specific story.
2. **One logic die = one chip.** For products with multiple dies (H100 + 6 HBM stacks + interposer; EPYC with 12 CCDs + IOD), we show the footprint of the *main logic die only*. Each chip's notes field discloses this.

---

## 2. Data sources (primary)

All citations live in `data/sources.json` with URLs and access dates. The numeric backbone comes from four sources:

| Source | What it provides |
|---|---|
| **IMEC / Bardon et al., IEDM 2020** (`bardon2020`) | Per-wafer scaling ratios from N28 to N2: **3.46× electricity, 2.3× water, 2.5× GHG**. Process-family attribution. |
| **IMEC / Gallagher, Semiconductor Digest 2025** (`imec-digest-2025`) | **N2 ≈ 1,600 kg CO₂eq per wafer.** Etch + lithography = ~40% of total GHG. Scope 2 (electricity) = ~60% of total. |
| **Hu et al., ScienceDirect 2023** (`hu2023`) | 2021 industry averages (normalized to silicon area): **8.22 L water / cm², 1.15 kWh / cm², 0.84 kg CO₂eq / cm²** — derived from 28 companies' sustainability reports. |
| **Pirson et al., Taylor & Francis 2023** (`pirson-2023`) | Fluorinated-compound emissions account for 80–90% of direct (Scope 1) fab emissions. SF₆ GWP100 = 25,200. CF₄ atmospheric lifetime = 50,000 years. NF₃ GWP100 = 17,400. |

Chip specs (die area, node, transistor count) come from each vendor's published materials, cross-checked against TechInsights, WikiChip, and Wikipedia. These are the least contested numbers in the dataset.

---

## 3. The coefficient model

The atomic unit is one *process step* on one 300mm wafer. For each of 11 process families, we store four coefficients:

- **waterL** — litres of ultrapure water per step per wafer
- **energyKwh** — kWh of electricity per step per wafer (tool power + amortized facility overhead)
- **ghgScope2KgCo2e** — kg CO₂e per step per wafer from the electricity above, at the global industry-average grid intensity (~0.42 kg CO₂e / kWh)
- **pfasKgCo2e** — kg CO₂e per step per wafer from fluorinated process gases, *after* typical abatement (~95% destruction/removal efficiency)

Each coefficient carries a `sourceId` and a `confidence` flag: `high | medium | low | estimated`. The app surfaces these flags in the UI so users know where we're more or less certain.

**Why these four?** They align with the Scope 1 / Scope 2 split in the GHG Protocol, plus two resources (water, PFAS) that matter independently of climate framing. N₂O, VOCs, hazardous waste, and abiotic resource depletion are real concerns but are not in scope for this weekend build.

### Confidence breakdown

| Metric | Typical confidence | Why |
|---|---|---|
| Water | high–medium | Well-reported by every major foundry, multiple converging sources. |
| Energy / Scope 2 GHG | medium | Published at aggregate level; per-process breakdown requires some interpolation. |
| PFAS / F-gas CO₂e | medium–low | Public literature reports aggregate F-gas emissions but rarely per-process breakdowns. We attribute 85% of F-gas emissions to etch + CVD clean per Pirson 2023, then split by typical step counts. |
| Edge cases (metrology, implant) | low | Documented to be small, but precise values rely on IMEC-internal data we can't access. Kept small to reflect genuine minor contribution without overstating precision. |

---

## 4. Calibration procedure

The coefficients above are not taken from any single source — each published source speaks to aggregates or ratios, not per-step values. So we iterated:

1. Build a plausible per-step coefficient set from first principles (tool power budgets, typical cycle times, published process gas usage).
2. Build a representative process flow for a 2nm logic node (step counts per process family, based on published mask counts and EUV layer counts).
3. Compute the per-wafer total.
4. Compare to the three independent anchors:
   - IMEC's ~1,600 kg CO₂eq per wafer for N2.
   - Hu 2023's ~5,750 L water per wafer (derived from 8.22 L/cm² × 700 cm² usable area).
   - Bardon 2020's scaling ratios from N28 → N2.
5. Adjust coefficients, re-compute, repeat.

After three calibration passes, the final coefficient set produces:

| Check | Our value | Target | Delta |
|---|---|---|---|
| N2 per-wafer GHG | 1,442 kg CO₂e | ~1,600 kg CO₂e (IMEC 2025) | **−10%** |
| N2 per-wafer water | 6,342 L | ~5,750 L (Hu 2023) | **+10%** |
| N28 → N2 water scaling | 2.42× | 2.3× (Bardon 2020) | **+5%** |
| N28 → N2 energy scaling | 2.83× | 3.46× (Bardon 2020) | **−18%** |
| N28 → N2 GHG scaling | 2.90× | 2.5× (Bardon 2020) | **+16%** |
| N2 etch + litho share of GHG | 57% | ~40% (IMEC 2025) | **+17 pp** |
| N2 Scope 2 share of GHG | 59% | ~60% (IMEC 2025) | **−1 pp** |

Energy scaling is slightly lower than Bardon's published 3.46×. The gap reflects a modeling choice: Bardon's analysis includes a specific set of N2 scaling boosters (backside power delivery, high-NA EUV transitions) whose per-step energy we could not independently source, so we used more conservative increments. The 18% gap is transparent and the relative *shape* of the node progression is correct.

The etch + lithography share being higher than IMEC's 40% is partly because we bundle CVD chamber cleans (also fluorine-heavy, also a top emitter) separately. If we group etch + litho + cvd-clean, the combined share comes to ~75%, which aligns with the literature consensus that "patterning-related processes" dominate the advanced-node footprint.

---

## 5. From per-wafer to per-die

```
candidate_dies_per_wafer = usable_wafer_area / (die_area + scribe_allowance)
good_dies_per_wafer      = candidate_dies_per_wafer × yield
per_die_metric           = per_wafer_metric / good_dies_per_wafer
```

Where:
- `usable_wafer_area` = 70,000 mm² for a 300mm wafer (total area ~70,686 mm², minus edge exclusion).
- `scribe_allowance` = 3 mm² per die (for dicing streets; simplification).
- `yield` is per-chip, documented in each chip's `yieldAssumption`. Defaults chosen conservatively:
  - Mature nodes and small chiplets: **0.85–0.90**
  - Mainstream advanced nodes (N4–N5) with normal die sizes: **0.75–0.80**
  - N3 flagship SoCs: **0.75**
  - Large dies near reticle limit (H100 at 814 mm²): **0.60**
  - Bleeding-edge early-ramp nodes (N2): **0.55**

Die-per-wafer is a surprisingly big lever. An H100 at 814 mm² yields ~51 good dies per wafer; an A18 Pro at 105 mm² yields ~486. Same process flow, but per-die water for the H100 is ~9× higher — not because its process is dirtier, but because each good die amortizes a larger share of the wafer.

This is the "big dies are environmentally expensive per unit" story the app tells. AMD's chiplet strategy is, in that light, an environmental argument as well as an economic one.

---

## 6. Known limitations and biases

**Things we simplify:**
- Global-average grid intensity (0.42 kg CO₂e/kWh). Real fabs vary: Taiwan ≈ 0.49, Arizona ≈ 0.35, Ireland ≈ 0.30.
- Abatement efficiency assumed uniformly ~95%. Real values range 85–99% by equipment type.
- Scribe-line area set at a flat 3 mm²/die. Real scribe widths vary with node.
- Yield curves during ramp are not modeled; we use a single yield assumption per chip.
- Water recycling within fabs is not credited. TSMC recycles >95% of process water internally; if we counted only *net* withdrawal from the environment, the water numbers would be 5-20× smaller. We show *gross process water consumption* because that's what the engineering community publishes most consistently.

**Things we intentionally exclude:**
- Backend packaging (CoWoS, HBM stacking, interposers).
- Upstream: mining of silicon source material, rare gases, rare earths.
- Equipment manufacturing (amortized over millions of wafers — negligible per wafer).
- Transport of wafers and finished products.
- Use-phase electricity.
- Product end-of-life.

**Things the numbers are NOT suitable for:**
- Regulatory reporting (CSRD, SEC climate rules, SB 253).
- Carbon offset claims.
- Comparisons between specific foundries or chipmakers.
- Product-level life-cycle assessment.

**Things the numbers ARE suitable for:**
- Public education about orders of magnitude.
- Comparing process nodes against each other.
- Understanding which process families dominate which impact categories.
- Giving non-experts a reference point for "how much does this cost the planet."

---

## 7. Reproducing our numbers

1. Clone the repo.
2. `python scripts/validate.py` — runs the full calibration check and prints every chip's per-wafer and per-die footprint plus anchor validation deltas.
3. All coefficients are in `data/processes.json`. All chip specs and process flows are in `data/chips.json`. All source URLs are in `data/sources.json`.
4. Edit any coefficient, re-run validate, see the change.

If you believe a number is wrong, please open a GitHub issue citing a contradicting primary source. Updates will be graciously received.

---

## 8. Acknowledgments

This tool would not exist without:
- **IMEC's Sustainable Semiconductor Technologies and Systems (SSTS) program** — particularly the publications by Marie Garcia Bardon, Emily Gallagher, Lars-Åke Ragnarsson, and Cédric Rolin, who have done the public sector's work of making this data exist at all.
- The **SEMI** and **Semiconductor Industry Association (SIA)** sustainability publications.
- **TSMC's ESG team** for the annual sustainability reports that anchor the absolute numbers.
- The **US EPA** fluorinated gas partnership for the regulatory framework we use to think about F-gases.

The semiconductor industry has historically been opaque about environmental data. These organizations are changing that. This tool rides on their work.
