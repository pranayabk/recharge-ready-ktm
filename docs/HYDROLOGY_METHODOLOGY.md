# Hydrological & Policy Modeling Methodology

**Project:** Recharge-Ready Kathmandu  
**Scope:** Property- & Ward-Level Flash Flood Mitigation & Groundwater Recharge Simulator

---

## 1. Meteorological Baseline (`src/data/rainfall_ktm.json`)
* **Annual Precipitation:** Calibrated to **1,400 mm/year**, aligned with long-term Department of Hydrology and Meteorology (DHM) Kathmandu Valley station normals (~1,350–1,450 mm/year).
* **Seasonal Distribution:** Models Kathmandu's bimodal monsoon skew, where **~80% of annual rainfall occurs between June and September**.
* **Design Cloudburst Event:** Uses a **50 mm/hr** peak storm intensity benchmark to size flood-diversion storage against acute urban flash-flooding events.

---

## 2. Hydrogeological Zoning (`src/data/ktm_zones.json`)
Spatial classification uses `@turf/boolean-point-in-polygon` against simplified polygons derived from **JICA / Groundwater Resources Development Board (GWRDB)** Kathmandu Valley aquifer mapping:

| Zone ID | Geological Formation | Infiltration Multiplier | Primary Retrofit Strategy |
| :--- | :--- | :---: | :--- |
| `NORTH_ALLUVIAL` | Northern sandy/gravelly fan deposits (Budhanilkantha, Bansbari, Tokha) | **1.00** | Deep Gravity Recharge Pits (2.5m–3.0m) |
| `CENTRAL_CLAY` | Central *Kalimati* lacustrine black clay aquitard (Putalisadak, Tripureshwor, Core KMC) | **0.45** | Shallow Bio-Retention / Zero-Footprint Detention |
| `SOUTH_MIXED` | Southern mixed alluvial-lacustrine deposits (Patan, Harisiddhi, Kirtipur) | **0.75** | Hybrid Shallow Recharge Pit + Overflow Cistern |
| `OUTSIDE_VALLEY` | Colluvial foothill deposits along valley rim | **0.60** | Contour Recharge Trench with Silt Trap |

### Tight-Plot Engineering Override (`permeableYardPercent < 15%`)
Dense urban plots in Kathmandu often lack open yard space for conventional soakaways. When permeable yard area falls below **15%**, the engine overrides standard pit recommendations with **zero-footprint retrofits**:
* **Under-Parking Modular Recharge Shafts** (in permeable/alluvial zones)
* **Rooftop / Under-Stair Detention Tanks with Slow-Release Orifice Valves** (in low-permeability *Kalimati* clay zones, delaying peak storm discharge into municipal drains by 4–6 hours)

---

## 3. Core Hydrological & Economic Equations (`src/engine/hydroEngine.ts`)

1. **Net Annual Harvestable Runoff (Liters):**
   $$V_{\text{runoff}} = A_{\text{roof}} \times R_{\text{annual}} \times C_r \times \eta_{\text{ff}}$$
   * $A_{\text{roof}}$: Effective catchment area ($\text{m}^2$)
   * $R_{\text{annual}}$: $1,400\text{ mm}$
   * $C_r$: Runoff coefficient (`0.90` for RCC concrete, `0.85` for corrugated CGI metal, `0.75` for tiled/green roofs)
   * $\eta_{\text{ff}}$: `0.85` collection efficiency (accounting for a 15% first-flush diversion and evaporation loss)

2. **Net Aquifer Recharge (Liters):**
   $$V_{\text{recharge}} = V_{\text{runoff}} \times M_{\text{soil}}$$
   * $M_{\text{soil}}$: Zone infiltration multiplier (`1.00`, `0.75`, `0.60`, or `0.45`)

3. **Cloudburst Peak Diversion & Pit Sizing:**
   $$V_{\text{storm}} = A_{\text{roof}} \times 50\text{ mm} \times C_r$$
   $$N_{\text{pits}} = \left\lceil \frac{V_{\text{storm}}}{1,130\text{ L}} \right\rceil$$
   * Each standard gravel-packed recharge ring pit ($1.0\text{ m}$ diameter $\times 1.5\text{ m}$ effective depth) provides **$\approx 1,130\text{ L}$** of surge buffer volume.

4. **Ward-Scale Multiplier:**
   Simulates collective neighborhood adoption ($1\text{ to }1,000\text{ buildings}$) by scaling storm volume diverted, pits/tanks deployed, capital cost, and financial savings linearly across homogeneous ward parcels.

5. **Municipal Rebate & Payback:**
   * Aligned with **Kathmandu Metropolitan City (KMC) / Lalitpur Metropolitan City (LMC)** rainwater harvesting and recharge property tax incentives (up to **10% annual property tax rebate** based on Recharge Readiness Score).
   * Combines annual tax rebate + avoided tanker/municipal water purchase savings ($\text{NPR } 0.35/\text{L}$ on usable harvested fraction) to compute **simple payback period (years)**.