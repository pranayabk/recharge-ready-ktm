import rainfallData from '../data/rainfall_ktm.json';
import type {
  RoofMaterial,
  SimulationInput,
  SimulationResult,
} from '../types/simulator';
import { lookupHydroZone } from './zoneLookup';

const RUNOFF_COEFFICIENTS: Record<RoofMaterial, number> = {
  RCC_CONCRETE: 0.9,
  CGI_METAL: 0.95,
  TILED_GREEN: 0.75,
};

const FIRST_FLUSH_EFFICIENCY = 0.85;
const PIT_STORAGE_CAPACITY_LITERS = 1130; // 1.2m dia x 2.5m depth @ 40% gravel/boulder void ratio
const PIT_UNIT_COST_NPR = 28000;
const TANKER_WATER_VALUE_PER_LITER_NPR = 0.35;

export function runSimulation(input: SimulationInput): SimulationResult {
  const safeArea = Math.max(0, input.roofAreaSqM);
  const multiplier = Math.max(1, input.wardBuildingMultiplier);
  const runoffCoeff = RUNOFF_COEFFICIENTS[input.roofMaterial];

  const zone = lookupHydroZone(input.lat, input.lng);

  // 1. Single-building annual runoff & effective groundwater recharge
  const singleAnnualRunoff =
    safeArea * rainfallData.annualTotalMm * runoffCoeff * FIRST_FLUSH_EFFICIENCY;
  const singleAnnualRecharge =
    singleAnnualRunoff * zone.infiltrationMultiplier;

  // 2. Peak 50mm / 2-hour Kathmandu cloudburst diverted from street drains
  const singleCloudburstDiverted =
    safeArea * rainfallData.designCloudburstMm * runoffCoeff;

  // 3. Civil engineering structure sizing & tight-plot adaptation
  const isTightPlot = input.permeableYardPercent < 15;
  const singlePitsRequired =
    safeArea === 0
      ? 0
      : Math.max(
          1,
          Math.ceil(singleCloudburstDiverted / PIT_STORAGE_CAPACITY_LITERS)
        );

  let adaptedRecommendation = zone.engineeringRecommendation;
  let pitDimensions = '1.2m diameter × 2.5m depth (Boulder-Gravel-Sand Filter)';

  if (isTightPlot && zone.zoneId === 'CENTRAL_CLAY') {
    adaptedRecommendation =
      'Zero-Footprint Rooftop/Under-Stair Detention Tank + Slow-Release Orifice Valve (holds cloudburst peak for 4 hrs until street drains clear).';
    pitDimensions = 'Modular 1,200L HDPE Detention Tank (No Yard Digging Required)';
  } else if (isTightPlot) {
    adaptedRecommendation =
      'Under-Parking Flush Manhole Recharge Shaft (sited beneath ground-floor parking slab for tight 3–4 aana plots).';
    pitDimensions = '1.0m diameter × 3.0m depth Flush Parking-Slab Shaft';
  }

  // 4. Readiness Score (0-100) & Municipal Tax Rebate Policy
  const volumeScore = Math.min(60, (singleAnnualRecharge / 150000) * 60);
  const soilScore = zone.infiltrationMultiplier * 25;
  const yardScore = (Math.min(100, Math.max(0, input.permeableYardPercent)) / 100) * 15;
  const readinessScore =
    safeArea === 0 ? 0 : Math.min(100, Math.round(volumeScore + soilScore + yardScore));

  let rebatePercentage = 0;
  let rebateTierLabel = 'Standard (0% Rebate)';
  if (readinessScore >= 80) {
    rebatePercentage = 15;
    rebateTierLabel = 'Platinum — 15% Municipal Property Tax Rebate';
  } else if (readinessScore >= 50) {
    rebatePercentage = 10;
    rebateTierLabel = 'Gold — 10% Municipal Property Tax Rebate';
  } else if (readinessScore >= 25) {
    rebatePercentage = 5;
    rebateTierLabel = 'Silver — 5% Municipal Property Tax Rebate';
  }

  // 5. Financial ROI (single building) & Ward-scaled totals
  const singleCostNPR = singlePitsRequired * PIT_UNIT_COST_NPR;
  const singleTaxSavings = (input.annualPropertyTaxNPR * rebatePercentage) / 100;
  const singleWaterSavings =
    singleAnnualRecharge * 0.4 * TANKER_WATER_VALUE_PER_LITER_NPR;
  const totalSingleAnnualSavings = singleTaxSavings + singleWaterSavings;
  const paybackYears =
    totalSingleAnnualSavings > 0
      ? Number((singleCostNPR / totalSingleAnnualSavings).toFixed(1))
      : 0;

  // 6. Monthly breakdown (scaled by ward multiplier)
  const monthlyRunoffLiters = rainfallData.monthly.map((m) =>
    Math.round(
      safeArea * m.rainfallMm * runoffCoeff * FIRST_FLUSH_EFFICIENCY * multiplier
    )
  );
  const monthlyRechargeLiters = monthlyRunoffLiters.map((vol) =>
    Math.round(vol * zone.infiltrationMultiplier)
  );

  return {
    zoneId: zone.zoneId,
    zoneName: zone.zoneName,
    soilDescription: zone.soilDescription,
    engineeringRecommendation: adaptedRecommendation,
    infiltrationMultiplier: zone.infiltrationMultiplier,
    annualRunoffLiters: Math.round(singleAnnualRunoff * multiplier),
    annualRechargeLiters: Math.round(singleAnnualRecharge * multiplier),
    cloudburstDivertedLiters: Math.round(singleCloudburstDiverted * multiplier),
    pitsRequired: singlePitsRequired * multiplier,
    pitDimensions,
    estimatedCostNPR: Math.round(singleCostNPR * multiplier),
    readinessScore,
    rebatePercentage,
    rebateTierLabel,
    annualTaxSavingsNPR: Math.round(singleTaxSavings * multiplier),
    annualWaterSavingsNPR: Math.round(singleWaterSavings * multiplier),
    paybackYears,
    monthlyRunoffLiters,
    monthlyRechargeLiters,
  };
}