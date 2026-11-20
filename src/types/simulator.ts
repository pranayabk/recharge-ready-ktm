export type RoofMaterial = 'RCC_CONCRETE' | 'CGI_METAL' | 'TILED_GREEN';

export type HydroZoneId =
  | 'NORTH_ALLUVIAL'
  | 'CENTRAL_CLAY'
  | 'SOUTH_MIXED'
  | 'OUTSIDE_VALLEY';

export interface SimulationInput {
  lat: number;
  lng: number;
  roofAreaSqM: number;
  roofMaterial: RoofMaterial;
  permeableYardPercent: number;      // 0 to 100
  annualPropertyTaxNPR: number;      // Default: 15000
  wardBuildingMultiplier: number;    // 1 | 100 | 500 | 1000
}

export interface SimulationResult {
  zoneId: HydroZoneId;
  zoneName: string;
  soilDescription: string;
  engineeringRecommendation: string;
  infiltrationMultiplier: number;
  annualRunoffLiters: number;
  annualRechargeLiters: number;
  cloudburstDivertedLiters: number;
  pitsRequired: number;
  pitDimensions: string;
  estimatedCostNPR: number;
  readinessScore: number;            // 0 to 100
  rebatePercentage: number;          // 0 | 5 | 10 | 15
  rebateTierLabel: string;
  annualTaxSavingsNPR: number;
  annualWaterSavingsNPR: number;
  paybackYears: number;
  monthlyRunoffLiters: number[];     // 12 elements (Jan–Dec)
  monthlyRechargeLiters: number[];   // 12 elements (Jan–Dec)
}

export interface PresetLocation {
  id: string;
  label: string;
  wardLabel: string;
  lat: number;
  lng: number;
  defaultPolygon: [number, number][]; // [lat, lng] pairs for Leaflet
  roofAreaSqM: number;
  roofMaterial: RoofMaterial;
  permeableYardPercent: number;
  annualPropertyTaxNPR: number;
}