# API Contract: Engine (Dev2) ↔ UI (Dev1)

There is no server. The "backend" is a set of pure TypeScript functions that run in the browser.
Types live in `src/types/simulator.ts`. **Change them only by agreement between Dev1 and Dev2.**

## Units
| Kind | Unit |
| :--- | :--- |
| Volume | litres (integers) |
| Money | NPR (integers) |
| Area | m² |
| Percent | 0–100 |
| Coordinates | `lat`, `lng` decimal degrees (WGS84) |

⚠️ Leaflet uses `[lat, lng]`. GeoJSON (`ktm_zones.json`) uses `[lng, lat]`.

## `runSimulation(input: SimulationInput): SimulationResult`
`src/engine/hydroEngine.ts`. Pure, synchronous and fast (<1 ms), so call it straight from render:
```ts
const result = useMemo(() => runSimulation(input), [input]);
```
Input is sanitised internally: negative or NaN numbers are clamped, yard % is clamped to 0–100, the multiplier is at least 1, and an unknown roof material becomes `RCC_CONCRETE`. The UI never needs to guard against NaN.

### `SimulationInput`
| Field | Notes |
| :--- | :--- |
| `lat`, `lng` | Point on the map. Determines the zone. |
| `roofAreaSqM` | Per building. |
| `roofMaterial` | `'RCC_CONCRETE' \| 'CGI_METAL' \| 'TILED_GREEN'` |
| `permeableYardPercent` | `< 15` triggers the tight-plot override. |
| `annualPropertyTaxNPR` | Per building. |
| `wardBuildingMultiplier` | UI offers `1 \| 100 \| 500 \| 1000`. |

### `SimulationResult`
**[WARD]** = already multiplied by `wardBuildingMultiplier`. **[BUILDING]** = always one building.

| Field | Scope | Notes |
| :--- | :---: | :--- |
| `zoneId`, `zoneName`, `zoneColor`, `soilDescription`, `infiltrationMultiplier` | — | Zone info. `zoneColor` is a hex value for badges/legend. |
| `engineeringRecommendation` | — | Text that already reflects the tight-plot override. |
| `isTightPlot` | — | `true` when yard < 15%. |
| `annualRunoffLiters` | WARD | |
| `annualRechargeLiters` | WARD | |
| `cloudburstDivertedLiters` | WARD | 50 mm / 2 h design storm |
| `structureType` | — | `'RECHARGE_PIT' \| 'PARKING_SHAFT' \| 'DETENTION_TANK'`. Use it for icon and label ("pits", "shafts", "tanks"). |
| `structureDimensions` | — | Text |
| `structureCapacityLiters` | BUILDING | Volume of ONE unit |
| `structuresRequired` | WARD | |
| `estimatedCostNPR` | WARD | |
| `readinessScore` | BUILDING | 0–100 |
| `rebatePercentage`, `rebateTierLabel` | BUILDING | 0 / 5 / 10 / 15 |
| `annualTaxSavingsNPR`, `annualWaterSavingsNPR` | WARD | |
| `paybackYears` | BUILDING | **`number \| null`**. Show "—" / "n/a" for `null`. |
| `monthlyRunoffLiters`, `monthlyRechargeLiters` | WARD | 12 values, Jan→Dec |

## Zones: `src/engine/zoneLookup.ts`
* `lookupHydroZone(lat, lng): ZoneMetadata`: the same lookup the engine uses.
* `KTM_ZONES`: the GeoJSON `FeatureCollection` to draw directly with `<GeoJSON data={KTM_ZONES} />`. Style each feature with `feature.properties.color`. `KTM_ZONES.fallback` holds the OUTSIDE_VALLEY metadata for the legend.

## Presets: `src/data/presets.ts`
`KTM_PRESETS: PresetLocation[]`: 3 demo properties (north, central clay, south). `defaultPolygon` is `[lat, lng][]`, ready for a Leaflet `<Polygon>`.

## Saved scenarios: `src/engine/storage.ts`
| Function | Returns |
| :--- | :--- |
| `loadSavedScenarios()` | `SavedScenario[]` (newest first, max 10) |
| `saveScenario(name, input)` | Updated list. A blank name gets an auto name. |
| `deleteScenario(id)` | Updated list |

* Only **inputs** are persisted. `result` is recomputed on every load, so saved scenarios always match the current engine.
* None of the functions throw. If localStorage is blocked or full, they return the in-memory list.

## Tests
`npm test` runs `src/engine/*.test.ts`. Any engine change must keep these passing. Add a test with each new rule.
