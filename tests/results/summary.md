# Test Results — Fab Footprint

Run date: 2026-04-18

## Summary

| | |
|---|---|
| **Test Suites** | 6 / 6 passed |
| **Tests** | 105 / 105 passed |
| **Duration** | ~0.4 s |

## Per-Suite Breakdown

| Suite | Tests | Status |
|---|---|---|
| `tests/data.test.ts` | 14 / 14 | ✅ PASS |
| `tests/compute.test.ts` | 21 / 21 | ✅ PASS |
| `tests/schemas.test.ts` | 27 / 27 | ✅ PASS |
| `tests/comparisons.test.ts` | 25 / 25 | ✅ PASS |
| `tests/rate-limit.test.ts` | 6 / 6 | ✅ PASS |
| `tests/api-routes.test.ts` | 12 / 12 | ✅ PASS (gracefully skipped — server not running) |

## What each suite covers

### data.test.ts
- `chips.json` structure, required fields, numeric ranges, unique IDs
- `processes.json` metric values, confidence levels, unique IDs
- `sources.json` required fields, valid URLs, unique IDs
- **Cross-reference integrity**: every `processMix.processId` resolves to a real process; every `specSourceId` and every process metric `sourceId` resolves to a real source

### compute.test.ts
- Output shape (all required keys present)
- `ghgTotalKgCo2e = ghgScope2 + pfas` identity for all chips
- All per-die metrics positive for all 21 real chips
- IMEC calibration anchors (N2 GHG within ±20%, water within ±20%)
- N28→N2 scaling ratios (water 1.8–3.0×, energy 2.0–5.0×, GHG 1.8–4.0×)
- N2 Scope-2 share of total GHG (40–80%, target 60%)
- `byFamily` sums equal `totals` (per-die); family keys are recognised process families

### schemas.test.ts
- `ConfidenceSchema` and `ProcessFamilySchema` accept/reject known/unknown values
- `ChipSchema`, `ProcessSchema`, `SourceSchema` valid and invalid inputs
- File-level schemas (`ChipsFileSchema`, `ProcessesFileSchema`, `SourcesFileSchema`)

### comparisons.test.ts
- All human-readable helpers (bathtubs, AC hours, car km, flight fraction)
- `formatMetric` at every numeric scale band
- `getComparison` returns non-empty strings for all four metric keys

### rate-limit.test.ts
- First request always allowed
- Exactly 10 requests allowed per 60-second window
- 11th request rejected with `retryAfterMs > 0`
- Window resets after 60 s (verified with mocked clock)
- Different IPs tracked independently

### api-routes.test.ts
- `/api/revalidate` POST → 200 with `revalidated: true`
- `/api/revalidate` GET → 405
- `/api/explain` rejects missing / unknown `chipId`
- `/api/chat` rejects missing fields, empty question, oversized question
- *All tests auto-skip gracefully when the server is not running. Start with `npm run dev` or `npm start` and re-run `npm test` to execute live.*

## Bug found and fixed during testing

- `sources.json` contained `type: "official_doc"` (Google Cloud docs) not present in `SourceTypeSchema`.
  Fixed by adding `"official_doc"` to the Zod enum in `lib/schemas.ts`.

## How to re-run

```bash
# From fab-footprint/
npm test                # interactive
npm run test:ci         # JSON output → tests/results/results.json
```

Machine-readable results are in `tests/results/results.json`.
