import rainfallData from '../data/rainfall_ktm.json';
import type {
  RoofMaterial,
  SimulationInput,
  SimulationResult,
  StructureType,
} from '../types/simulator';
import { lookupHydroZone } from './zoneLookup';

// ---------------------------------------------------------------------------
// Model constants (keep in sync with docs/HYDROLOGY_METHODOLOGY.md)
// ---------------------------------------------------------------------------

export const RUNOFF_COEFFICIENTS: Record<RoofMaterial, number> = {
  RCC_CONCRETE: 0.9,
  CGI_METAL: 0.95,
  TILED_GREEN: 0.75,
};

/** Fraction of runoff kept after first-flush diversion and evaporation loss. */
export const FIRST_FLUSH_EFFICIENCY = 0.85;

/** Below this permeable-yard share the plot is treated as "tight" (no room for yard pits). */
export const TIGHT_PLOT_YARD_PERCENT = 15;

/** Share of harvested runoff the household actually uses instead of buying tanker water. */
export const USABLE_HARVEST_FRACTION = 0.4;
export const TANKER_WATER_VALUE_PER_LITER_NPR = 0.35;

/** Single-building annual recharge (L) that earns the full 60-point volume score. */
export const VOLUME_SCORE_FULL_AT_LITERS = 150_000;

export interface StructureSpec {
  dimensions: string;
  capacityLiters: number;
  unitCostNPR: number; // indicative installed cost, excl. land/permits
}

const voidVolumeLiters = (diameterM: number, depthM: number, voidRatio: number) =>
  Math.round(Math.PI * (diameterM / 2) ** 2 * depthM * voidRatio * 1000);

export const STRUCTURES: Record<StructureType, StructureSpec> = {
  RECHARGE_PIT: {
    dimensions: '1.2m diameter × 2.5m depth (Boulder-Gravel-Sand Filter)',
    capacityLiters: voidVolumeLiters(1.2, 2.5, 0.4), // ≈ 1,131 L
    unitCostNPR: 28_000,
  },
  PARKING_SHAFT: {
    dimensions: '1.0m diameter × 3.0m depth Flush Parking-Slab Shaft',
    capacityLiters: voidVolumeLiters(1.0, 3.0, 0.4), // ≈ 942 L
    unitCostNPR: 35_000,
  },
  DETENTION_TANK: {
    dimensions: 'Modular 1,200L HDPE Detention Tank (No Yard Digging Required)',
    capacityLiters: 1_200,
    unitCostNPR: 22_000,
  },
};

const ROOF_MATERIALS = Object.keys(RUNOFF_COEFFICIENTS) as RoofMaterial[];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const finiteOr = (v: number, fallback: number) => (Number.isFinite(v) ? v : fallback);

/**
 * Normalises raw UI input so the engine never produces NaN / negative output.
 * Non-finite lat/lng are kept as NaN so the zone lookup falls back to OUTSIDE_VALLEY.
 */
export function sanitizeInput(input: SimulationInput): SimulationInput {
  return {
    lat: Number(input.lat),
    lng: Number(input.lng),
    roofAreaSqM: Math.max(0, finiteOr(Number(input.roofAreaSqM), 0)),
    roofMaterial: ROOF_MATERIALS.includes(input.roofMaterial)
      ? input.roofMaterial
      : 'RCC_CONCRETE',
    permeableYardPercent: clamp(finiteOr(Number(input.permeableYardPercent), 0), 0, 100),
    annualPropertyTaxNPR: Math.max(0, finiteOr(Number(input.annualPropertyTaxNPR), 0)),
    wardBuildingMultiplier: Math.max(
      1,
      Math.round(finiteOr(Number(input.wardBuildingMultiplier), 1))
    ),
  };
}

export function getRebateTier(readinessScore: number): {
  rebatePercentage: number;
  rebateTierLabel: string;
} {
  if (readinessScore >= 80) {
    return { rebatePercentage: 15, rebateTierLabel: 'Platinum — 15% Municipal Property Tax Rebate' };
  }
  if (readinessScore >= 50) {
    return { rebatePercentage: 10, rebateTierLabel: 'Gold — 10% Municipal Property Tax Rebate' };
  }
  if (readinessScore >= 25) {
    return { rebatePercentage: 5, rebateTierLabel: 'Silver — 5% Municipal Property Tax Rebate' };
  }
  return { rebatePercentage: 0, rebateTierLabel: 'Standard (0% Rebate)' };
}

export function runSimulation(rawInput: SimulationInput): SimulationResult {
  const input = sanitizeInput(rawInput);
  const area = input.roofAreaSqM;
  const multiplier = input.wardBuildingMultiplier;
  const runoffCoeff = RUNOFF_COEFFICIENTS[input.roofMaterial];
  const zone = lookupHydroZone(input.lat, input.lng);

  // 1. Single-building annual runoff & effective groundwater recharge
  const singleAnnualRunoff =
    area * rainfallData.annualTotalMm * runoffCoeff * FIRST_FLUSH_EFFICIENCY;
  const singleAnnualRecharge = singleAnnualRunoff * zone.infiltrationMultiplier;

  // 2. Design cloudburst (50 mm over 2 h) diverted from street drains
  const singleCloudburstDiverted = area * rainfallData.designCloudburstMm * runoffCoeff;

  // 3. Structure selection & sizing (tight-plot adaptation)
  const isTightPlot = input.permeableYardPercent < TIGHT_PLOT_YARD_PERCENT;
  let structureType: StructureType = 'RECHARGE_PIT';
  let recommendation = zone.engineeringRecommendation;

  if (isTightPlot && zone.zoneId === 'CENTRAL_CLAY') {
    structureType = 'DETENTION_TANK';
    recommendation =
      'Zero-Footprint Rooftop/Under-Stair Detention Tank + Slow-Release Orifice Valve (holds cloudburst peak for 4 hrs until street drains clear).';
  } else if (isTightPlot) {
    structureType = 'PARKING_SHAFT';
    recommendation =
      'Under-Parking Flush Manhole Recharge Shaft (sited beneath ground-floor parking slab for tight 3–4 aana plots).';
  }

  const structure = STRUCTURES[structureType];
  const singleStructures =
    area === 0
      ? 0
      : Math.max(1, Math.ceil(singleCloudburstDiverted / structure.capacityLiters));

  // 4. Readiness Score (0-100) & municipal tax rebate
  const volumeScore = Math.min(60, (singleAnnualRecharge / VOLUME_SCORE_FULL_AT_LITERS) * 60);
  const soilScore = zone.infiltrationMultiplier * 25;
  const yardScore = (input.permeableYardPercent / 100) * 15;
  const readinessScore =
    area === 0 ? 0 : Math.min(100, Math.round(volumeScore + soilScore + yardScore));
  const { rebatePercentage, rebateTierLabel } = getRebateTier(readinessScore);

  // 5. Financial ROI (single building) & ward-scaled totals
  const singleCostNPR = singleStructures * structure.unitCostNPR;
  const singleTaxSavings = (input.annualPropertyTaxNPR * rebatePercentage) / 100;
  const singleWaterSavings =
    singleAnnualRunoff * USABLE_HARVEST_FRACTION * TANKER_WATER_VALUE_PER_LITER_NPR;
  const singleAnnualSavings = singleTaxSavings + singleWaterSavings;
  const paybackYears =
    singleCostNPR > 0 && singleAnnualSavings > 0
      ? Number((singleCostNPR / singleAnnualSavings).toFixed(1))
      : null;

  // 6. Monthly breakdown (ward-scaled; computed from unrounded values)
  const monthlyRunoffRaw = rainfallData.monthly.map(
    (m) => area * m.rainfallMm * runoffCoeff * FIRST_FLUSH_EFFICIENCY * multiplier
  );

  return {
    zoneId: zone.zoneId,
    zoneName: zone.zoneName,
    zoneColor: zone.color,
    soilDescription: zone.soilDescription,
    engineeringRecommendation: recommendation,
    infiltrationMultiplier: zone.infiltrationMultiplier,
    isTightPlot,
    annualRunoffLiters: Math.round(singleAnnualRunoff * multiplier),
    annualRechargeLiters: Math.round(singleAnnualRecharge * multiplier),
    cloudburstDivertedLiters: Math.round(singleCloudburstDiverted * multiplier),
    structureType,
    structureDimensions: structure.dimensions,
    structureCapacityLiters: structure.capacityLiters,
    structuresRequired: singleStructures * multiplier,
    estimatedCostNPR: Math.round(singleCostNPR * multiplier),
    readinessScore,
    rebatePercentage,
    rebateTierLabel,
    annualTaxSavingsNPR: Math.round(singleTaxSavings * multiplier),
    annualWaterSavingsNPR: Math.round(singleWaterSavings * multiplier),
    paybackYears,
    monthlyRunoffLiters: monthlyRunoffRaw.map(Math.round),
    monthlyRechargeLiters: monthlyRunoffRaw.map((v) =>
      Math.round(v * zone.infiltrationMultiplier)
    ),
  };
}
