#!/usr/bin/env python3
"""End-to-end validation of the Fab Footprint dataset.

Lives inside data/ alongside the JSON files it validates.
Loads chips.json + processes.json, computes per-wafer and per-die
footprints, validates against IMEC published anchors. Run this after any
data edit to confirm calibration still holds.

Usage (from repo root):
    python3 fab-footprint/data/validate.py
Or (from inside data/):
    python3 validate.py
"""
import json
from pathlib import Path

data_dir = Path(__file__).resolve().parent  # validate.py now lives in data/

with open(data_dir / "processes.json") as f:
    processes = {p["id"]: p for p in json.load(f)["processes"]}
with open(data_dir / "chips.json") as f:
    chips_data = json.load(f)

WAFER_USABLE_MM2 = chips_data["_wafer"]["usableAreaMm2"]

def compute_wafer(chip):
    totals = {"water": 0.0, "energy": 0.0, "ghg_s2": 0.0, "pfas": 0.0}
    total_steps = 0
    by_family = {}
    for item in chip["processMix"]:
        p = processes[item["processId"]]
        n = item["stepCount"]
        total_steps += n
        s = p["perStepPerWafer"]
        contrib = {
            "water": s["waterL"]["value"] * n,
            "energy": s["energyKwh"]["value"] * n,
            "ghg_s2": s["ghgScope2KgCo2e"]["value"] * n,
            "pfas": s["pfasKgCo2e"]["value"] * n,
        }
        for k, v in contrib.items():
            totals[k] += v
        fam = p["family"]
        if fam not in by_family:
            by_family[fam] = {"water": 0, "energy": 0, "ghg_s2": 0, "pfas": 0}
        for k, v in contrib.items():
            by_family[fam][k] += v
    totals["ghg_total"] = totals["ghg_s2"] + totals["pfas"]
    return totals, total_steps, by_family

def compute_die(chip, wafer_totals):
    """Amortize per-wafer totals to a single good die."""
    die_area = chip["dieAreaMm2"]
    yield_frac = chip["yieldAssumption"]
    candidate_dies_per_wafer = WAFER_USABLE_MM2 / (die_area + 3)  # scribe allowance
    good_dies_per_wafer = candidate_dies_per_wafer * yield_frac
    return {k: v / good_dies_per_wafer for k, v in wafer_totals.items()}, good_dies_per_wafer

print("=" * 90)
print("PER-WAFER FOOTPRINTS (calibration check)")
print("=" * 90)
print(f"{'Chip':30s} {'Steps':>6s} {'Water(L)':>10s} {'Energy(kWh)':>13s} {'GHG(kg)':>10s} {'PFAS':>8s}")
for chip in chips_data["chips"]:
    t, s, _ = compute_wafer(chip)
    print(f"{chip['name'][:30]:30s} {s:>6d} {t['water']:>10,.0f} {t['energy']:>13,.0f} "
          f"{t['ghg_total']:>10,.0f} {t['pfas']:>8,.0f}")

print()
print("=" * 90)
print("PER-DIE FOOTPRINTS (what the app shows users)")
print("=" * 90)
print(f"{'Chip':30s} {'Area':>7s} {'Yield':>6s} {'Dies/W':>8s} {'Water(L)':>10s} {'Energy(kWh)':>13s} {'GHG(kg)':>10s}")
for chip in chips_data["chips"]:
    t, s, _ = compute_wafer(chip)
    d, dpw = compute_die(chip, t)
    print(f"{chip['name'][:30]:30s} {chip['dieAreaMm2']:>7.1f} {chip['yieldAssumption']:>6.2f} "
          f"{dpw:>8.1f} {d['water']:>10,.1f} {d['energy']:>13,.1f} {d['ghg_total']:>10,.1f}")

print()
print("=" * 90)
print("ANCHOR VALIDATION")
print("=" * 90)
# IMEC 2025: N2 ~1600 kg CO2eq per wafer
n2 = next(c for c in chips_data["chips"] if c["id"] == "ref-n2")
n28 = next(c for c in chips_data["chips"] if c["id"] == "ref-n28")
t2, _, _ = compute_wafer(n2)
t28, _, _ = compute_wafer(n28)

print(f"N2 per-wafer GHG:     {t2['ghg_total']:>6,.0f} kg CO2e  (IMEC target: ~1,600, delta: "
      f"{(t2['ghg_total']-1600)/1600*100:+.0f}%)")
print(f"N2 per-wafer water:   {t2['water']:>6,.0f} L         (industry avg target ~5,750 L from Hu 2023, "
      f"delta: {(t2['water']-5750)/5750*100:+.0f}%)")
print()
print(f"N28 -> N2 scaling:")
print(f"  Water:  {t2['water']/t28['water']:.2f}x  (Bardon 2020 target: 2.3x)")
print(f"  Energy: {t2['energy']/t28['energy']:.2f}x  (Bardon 2020 target: 3.46x)")
print(f"  GHG:    {t2['ghg_total']/t28['ghg_total']:.2f}x  (Bardon 2020 target: 2.5x)")
print()
# Check etch + litho fraction of N2 GHG
t2, _, fam2 = compute_wafer(n2)
etch_litho_ghg = (fam2.get("etch",{}).get("ghg_s2",0) + fam2.get("etch",{}).get("pfas",0) +
                  fam2.get("lithography",{}).get("ghg_s2",0) + fam2.get("lithography",{}).get("pfas",0))
print(f"N2 etch+litho share of GHG: {etch_litho_ghg/t2['ghg_total']*100:.0f}%  (IMEC target: ~40%)")
scope2_share = t2["ghg_s2"] / t2["ghg_total"] * 100
print(f"N2 Scope 2 (electricity) share of GHG: {scope2_share:.0f}%  (IMEC target: ~60%)")
