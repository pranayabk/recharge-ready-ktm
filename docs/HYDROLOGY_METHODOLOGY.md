# Hydrological & Policy Modeling Methodology

**Project:** Recharge-Ready Kathmandu  
**Scope:** Property- & Ward-Level Flash Flood Mitigation & Groundwater Recharge Simulator

> **Source of truth:** the constants in `src/engine/hydroEngine.ts`. If you change a number there, change it here too.
> All figures are **MVP screening estimates**, not engineering design values.

---

## 1. Meteorological Baseline (`src/data/rainfall_ktm.json`)
* **Annual Precipitation:** **1,400 mm/year**, in line with long-term Department of Hydrology and Meteorology (DHM) Kathmandu Valley normals (~1,350–1,450 mm/year). The 12 monthly values sum to exactly 1,400 mm.
* **Seasonal Distribution:** Kathmandu's monsoon skew. **~79% of annual rainfall falls June–September** (1,110 of 1,400 mm).
* **Design Cloudburst Event:** **50 mm over 2 hours** (`designCloudburstMm`, `designCloudburstDurationHours`), used to size flood-diversion storage against acute urban flash flooding.

---

## 2. Hydrogeological Zoning (`src/data/ktm_zones.json`)
Spatial classification uses `@turf/boolean-point-in-polygon` against **simplified latitude bands** (lng 85.22–85.53) loosely based on **JICA / Groundwater Resources Development Board (GWRDB)** Kathmandu Valley aquifer mapping. Points outside every polygon fall back to `OUTSIDE_VALLEY` (defined in the same JSON under `fallback`).

| Zone ID | Latitude band | Geological Formation | Infiltration Multiplier | Default Retrofit |
| :--- | :--- | :--- | :---: | :--- |
| `NORTH_ALLUVIAL` | 27.735–27.810 | Northern sandy/gravelly fan deposits (Budhanilkantha, Bansbari, Tokha, Gokarna) | **1.00** | Deep Percolation Pit (2.5–3.5 m) |
| `CENTRAL_CLAY` | 27.665–27.735 | Central *Kalimati* lacustrine black clay aquitard (Putalisadak, Tripureshwor, core KMC, Patan, Kirtipur, Bhaktapur) | **0.45** | Shallow Dug-Well / Gravel Retention Trench (1.2–1.8 m) |
| `SOUTH_MIXED` | 27.590–27.665 | Southern mixed alluvial-lacustrine deposits (Harisiddhi, Chapagaun, Godawari) | **0.75** | Standard Modular Recharge Pit (2.0–2.5 m) |
| `OUTSIDE_VALLEY` | everything else | Colluvial foothill deposits along valley rim | **0.60** | Contour Recharge Trench with Silt Trap |

> ⚠️ Known limitation: real formation boundaries are irregular. Replace the rectangles with digitised GWRDB polygons when available. The engine needs no code change for this.

### Tight-Plot Engineering Override (`permeableYardPercent < 15`)
Dense urban plots often lack open yard space for soakaways. Below **15%** permeable yard the engine swaps the yard pit for a **zero-footprint** structure:

| Condition | `structureType` | Unit | Buffer volume | Indicative cost |
| :--- | :--- | :--- | :---: | :---: |
| Yard ≥ 15% (any zone) | `RECHARGE_PIT` | 1.2 m Ø × 2.5 m, 40% void gravel fill | ≈ 1,131 L | NPR 28,000 |
| Yard < 15%, not clay | `PARKING_SHAFT` | 1.0 m Ø × 3.0 m under parking slab, 40% void | ≈ 942 L | NPR 35,000 |
| Yard < 15%, `CENTRAL_CLAY` | `DETENTION_TANK` | 1,200 L HDPE tank + slow-release orifice (holds peak ~4 h) | 1,200 L | NPR 22,000 |

Unit costs are rough installed-cost placeholders. **Verify with a local contractor quote before the demo.**

---

## 3. Core Hydrological & Economic Equations (`src/engine/hydroEngine.ts`)

1. **Net Annual Harvestable Runoff (L):**
   $$V_{\text{runoff}} = A_{\text{roof}} \times R_{\text{annual}} \times C_r \times \eta_{\text{ff}}$$
   * $A_{\text{roof}}$: catchment area (m²); $R_{\text{annual}}$ = 1,400 mm (1 mm on 1 m² = 1 L)
   * $C_r$: runoff coefficient: `0.90` RCC concrete, `0.95` CGI metal, `0.75` tiled/green roof
   * $\eta_{\text{ff}}$: `0.85` collection efficiency (15% first-flush diversion + evaporation)

2. **Net Aquifer Recharge (L):**
   $$V_{\text{recharge}} = V_{\text{runoff}} \times M_{\text{soil}}$$

3. **Cloudburst Diversion & Structure Sizing:**
   $$V_{\text{storm}} = A_{\text{roof}} \times 50\text{ mm} \times C_r$$
   $$N_{\text{units}} = \max\left(1, \left\lceil \frac{V_{\text{storm}}}{V_{\text{unit}}} \right\rceil\right)\quad(0 \text{ if } A_{\text{roof}} = 0)$$
   where $V_{\text{unit}}$ is the buffer volume from the table above. Pit volume = $\pi r^2 h \times 0.4$ voids.

4. **Recharge Readiness Score (0–100, per building):**
   * Volume: $\min(60,\; V_{\text{recharge}} / 150{,}000 \times 60)$
   * Soil: $M_{\text{soil}} \times 25$
   * Yard: $\text{yard\%} / 100 \times 15$

5. **Rebate Tier (per building):** score ≥ 80 → **15%** (Platinum), ≥ 50 → **10%** (Gold), ≥ 25 → **5%** (Silver), else 0%.
   > These tiers are a **proposed policy scenario** for the pitch, inspired by KMC/LMC rainwater-harvesting incentives. Confirm the current official rebate rate before presenting it as existing policy.

6. **Savings & Payback (per building):**
   * Tax savings = property tax × rebate %
   * Water savings = $V_{\text{runoff}} \times 0.4$ (usable harvested fraction) × NPR 0.35/L (tanker price)
   * Payback = capital cost ÷ (tax + water savings), 1 decimal. `null` when there is nothing to build or no savings.

7. **Ward-Scale Multiplier:** simulates adoption across 1–1,000 identical buildings by scaling volumes, unit counts, cost, savings and the monthly series linearly. Score, rebate % and payback stay per-building. See `docs/API_CONTRACT.md` for which fields are scaled.
