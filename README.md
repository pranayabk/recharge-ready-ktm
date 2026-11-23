# Recharge-Ready Kathmandu

A browser-based simulator that shows how rooftop rainwater harvesting and recharge structures can **cut flash flooding** and **refill Kathmandu's groundwater**, for one property or a whole ward.

Pick a property on the map (or a demo preset). Set the roof area, roof material, open yard share and property tax. The app then shows:

- the **hydrogeological zone** (northern alluvial, central Kalimati clay, southern mixed, valley rim) and the right retrofit for it
- **cloudburst volume diverted** from street drains (50 mm / 2 h design storm)
- **annual runoff and groundwater recharge**, plus a monthly monsoon chart
- the **number and cost of pits / shafts / tanks**. Tight plots (< 15% yard) get zero-footprint options.
- a **Recharge Readiness Score**, a property-tax rebate tier and the payback period
- **ward-scale impact**: ×100, ×500 or ×1,000 buildings

## Quick start
Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine unit tests (vitest)
npm run lint
npm run build      # type-check + production build into dist/
```

## Project layout
```
src/
  engine/            # Dev2: pure calculation logic (the "backend")
    hydroEngine.ts   #   runSimulation(): all hydrology + finance maths
    zoneLookup.ts    #   point-in-polygon zone lookup, KTM_ZONES for the map
    storage.ts       #   saved scenarios (localStorage, inputs only)
    *.test.ts        #   unit tests
  data/              # rainfall normals, zone GeoJSON, demo presets
  types/simulator.ts # shared Dev1 ↔ Dev2 types (the contract)
  components/        # EXAMPLE UI (Dev2 test harness): InputPanel, ZoneMap, ResultsPanel, MonthlyChart, SavedScenarios
  lib/format.ts      # number / NPR / litre formatting (lakh/crore aware)
  App.tsx            # layout + state
docs/
  API_CONTRACT.md          # engine API, units, which fields are ward-scaled
  HYDROLOGY_METHODOLOGY.md # equations, constants, assumptions
  DEMO_SCRIPT.md           # 3-minute pitch walkthrough
```

## Team
| Track | Owns |
| :--- | :--- |
| **Dev1**: frontend | `src/components`, `src/App.tsx`, styling, map and chart UX |
| **Dev2**: engine / data | `src/engine`, `src/data`, `src/types`, tests, methodology docs |

Changes to `src/types/simulator.ts` need agreement from both tracks. See `docs/API_CONTRACT.md`.

> **Note:** the UI currently in `src/App.tsx` and `src/components/` is a **dummy / example UI** that Dev2 built to test the engine's output. Dev1 can reuse it, restyle it or replace it entirely.

## Stack
React 19 · TypeScript · Vite · Tailwind CSS v4 · Leaflet / react-leaflet · Recharts · Turf · Vitest

## Limitations (MVP)
- Zone boundaries are simplified latitude bands, not surveyed geology.
- Unit costs, the tanker water price and the rebate tiers are indicative or proposed values. See `docs/HYDROLOGY_METHODOLOGY.md`.
- There is no backend. Scenarios are saved in the browser only.
