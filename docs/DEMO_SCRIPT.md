# Demo Script (~3 minutes)

> Before going on stage: run `npm run dev`, open http://localhost:5173 and check that the map tiles load (they need internet).
> To clear old saved scenarios, run `localStorage.clear()` in the browser console.

## 0. Hook (20 s)
"Every monsoon, Kathmandu's streets flood within minutes of a cloudburst. Meanwhile, the valley's groundwater keeps falling. The rain that floods our streets is the same water our aquifers are missing."

## 1. A house in the north (40 s): **Budhanilkantha Residence**
* Click the preset. The map flies to the plot, inside the green **Northern Alluvial** zone (infiltration ×1).
* Point out:
  * 120 m² RCC roof → **5,400 L kept off the street** in one 50 mm storm
  * **~1.29 lakh litres** recharged per year
  * 5 recharge pits for **NPR 1.4 lakh**
* Score **81 → Platinum** (15% tax rebate) → **6.9-year payback**.

## 2. The hard case (45 s): **Putalisadak Commercial Complex**
* Click the preset. It is in the orange **Kalimati clay** zone (×0.45), and the yard is only 5%, so it is a tight plot.
* The engine **switches strategy**: no digging, but **25 rooftop / under-stair detention tanks** with slow-release valves that hold the storm peak for about 4 hours.
* "Even where water can't soak in, we can still stop it hitting the drain at the same moment as everyone else's."

## 3. Scale it up (40 s): **Patan / Harisiddhi**, then **×1,000**
* Click the preset (blue **Southern Mixed** zone), then the **×1,000** ward button.
* The headline numbers:
  * **6.94 million litres** diverted in a single cloudburst
  * **~124 million litres** recharged per year across 1,000 homes
* Show the monthly chart: almost all of it arrives June–September, exactly when the drains overflow.

## 4. Your own house (20 s)
* Click anywhere on the map, change the roof area or move the yard slider, and the results update live.
* Save it as a scenario. It survives a page reload.

## 5. Close (15 s)
"Recharge-Ready Kathmandu gives homeowners a reason to act, through payback and rebates, and gives the municipality a ward-level number to plan around."

---
**Likely judge questions**
* *Where do the numbers come from?* See `docs/HYDROLOGY_METHODOLOGY.md`: DHM rainfall normals, standard runoff coefficients, and pit volume = πr²h × 40% voids.
* *Are the rebates real?* They are a **proposed** tier scheme inspired by KMC/LMC rainwater-harvesting incentives. Say this clearly.
* *How accurate are the zones?* They are simplified bands for the MVP. Real GWRDB polygons can be dropped into `ktm_zones.json` with no code change.
