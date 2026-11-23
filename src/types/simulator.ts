export type RoofMaterial = 'RCC_CONCRETE' | 'CGI_METAL' | 'TILED_GREEN';

export type HydroZoneId =
  | 'NORTH_ALLUVIAL'
  | 'CENTRAL_CLAY'
  | 'SOUTH_MIXED'
  | 'OUTSIDE_VALLEY';

/** Physical structure the engine sizes for the cloudburst surge volume. */
export type StructureType =
  | 'RECHARGE_PIT' // standard yard pit (enough open yard)
  | 'PARKING_SHAFT' // tight plot, permeable zone: shaft under parking slab
  | 'DETENTION_TANK'; // tight plot, Kalimati clay: rooftop/under-stair tank

export interface SimulationInput {
  lat: number;
  lng: number;
  roofAreaSqM: number;               // per building, m²
  roofMaterial: RoofMaterial;
  permeableYardPercent: number;      // 0 to 100
  annualPropertyTaxNPR: number;      // per building, Default: 15000
  wardBuildingMultiplier: number;    // 1 | 100 | 500 | 1000
}

/**
 * Unit conventions:
 *  - Volumes in litres, money in NPR, percentages 0–100.
 *  - Fields marked [WARD] are multiplied by `wardBuildingMultiplier`.
 *  - Fields marked [BUILDING] always describe a single building.
 */
export interface SimulationResult {
  zoneId: HydroZoneId;
  zoneName: string;
  zoneColor: string;                 // hex colour for map / badges
  soilDescription: string;
  engineeringRecommendation: string;
  infiltrationMultiplier: number;
  isTightPlot: boolean;              // permeableYardPercent < 15

  annualRunoffLiters: number;        // [WARD] harvestable roof runoff
  annualRechargeLiters: number;      // [WARD] runoff reaching the aquifer
  cloudburstDivertedLiters: number;  // [WARD] design-storm volume kept off streets

  structureType: StructureType;
  structureDimensions: string;
  structureCapacityLiters: number;   // [BUILDING] buffer volume of ONE unit
  structuresRequired: number;        // [WARD] number of units
  estimatedCostNPR: number;          // [WARD] capital cost

  readinessScore: number;            // [BUILDING] 0 to 100
  rebatePercentage: number;          // [BUILDING] 0 | 5 | 10 | 15
  rebateTierLabel: string;
  annualTaxSavingsNPR: number;       // [WARD]
  annualWaterSavingsNPR: number;     // [WARD]
  paybackYears: number | null;       // [BUILDING] null = never pays back / nothing to build

  monthlyRunoffLiters: number[];     // [WARD] 12 elements (Jan–Dec)
  monthlyRechargeLiters: number[];   // [WARD] 12 elements (Jan–Dec)
}

export interface PresetLocation {
  id: string;
  label: string;
  wardLabel: string;
  lat: number;
  lng: number;
  defaultPolygon: [number, number][]; // [lat, lng] pairs for Leaflet (NOT GeoJSON order)
  roofAreaSqM: number;
  roofMaterial: RoofMaterial;
  permeableYardPercent: number;
  annualPropertyTaxNPR: number;
}
