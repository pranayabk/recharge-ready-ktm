import { describe, expect, it } from 'vitest';
import type { SimulationInput } from '../types/simulator';
import {
  getRebateTier,
  runSimulation,
  sanitizeInput,
  STRUCTURES,
} from './hydroEngine';

const NORTH = { lat: 27.7785, lng: 85.3621 };
const CENTRAL = { lat: 27.7032, lng: 85.3228 };
const SOUTH = { lat: 27.6385, lng: 85.3412 };

const base = (overrides: Partial<SimulationInput> = {}): SimulationInput => ({
  ...NORTH,
  roofAreaSqM: 100,
  roofMaterial: 'RCC_CONCRETE',
  permeableYardPercent: 30,
  annualPropertyTaxNPR: 15000,
  wardBuildingMultiplier: 1,
  ...overrides,
});

describe('Recharge-Ready KTM Hydrological Engine', () => {
  it('classifies Northern Alluvial zone and computes runoff, recharge and pits', () => {
    const res = runSimulation(base());

    expect(res.zoneId).toBe('NORTH_ALLUVIAL');
    expect(res.infiltrationMultiplier).toBe(1.0);
    // 100 * 1400 * 0.9 * 0.85 = 107,100 L
    expect(res.annualRunoffLiters).toBe(107100);
    expect(res.annualRechargeLiters).toBe(107100);
    // 100 * 50 * 0.9 = 4,500 L storm diversion -> ceil(4500 / 1131) = 4 pits
    expect(res.cloudburstDivertedLiters).toBe(4500);
    expect(res.structureType).toBe('RECHARGE_PIT');
    expect(res.structureCapacityLiters).toBe(1131);
    expect(res.structuresRequired).toBe(4);
    expect(res.estimatedCostNPR).toBe(4 * STRUCTURES.RECHARGE_PIT.unitCostNPR);
    expect(res.isTightPlot).toBe(false);
  });

  it('applies the infiltration multiplier per zone', () => {
    expect(runSimulation(base(CENTRAL)).annualRechargeLiters).toBe(Math.round(107100 * 0.45));
    expect(runSimulation(base(SOUTH)).annualRechargeLiters).toBe(Math.round(107100 * 0.75));
  });

  it.each([
    ['RCC_CONCRETE', 0.9],
    ['CGI_METAL', 0.95],
    ['TILED_GREEN', 0.75],
  ] as const)('uses runoff coefficient for %s', (roofMaterial, coeff) => {
    const res = runSimulation(base({ roofMaterial }));
    expect(res.annualRunoffLiters).toBe(Math.round(100 * 1400 * coeff * 0.85));
    expect(res.cloudburstDivertedLiters).toBe(Math.round(100 * 50 * coeff));
  });

  it('adapts tight plots in Central Kalimati Clay to zero-footprint detention tanks', () => {
    const res = runSimulation(
      base({ ...CENTRAL, permeableYardPercent: 5, annualPropertyTaxNPR: 20000 })
    );

    expect(res.zoneId).toBe('CENTRAL_CLAY');
    expect(res.infiltrationMultiplier).toBe(0.45);
    expect(res.engineeringRecommendation).toContain('Zero-Footprint');
    expect(res.structureType).toBe('DETENTION_TANK');
    // 4,500 L / 1,200 L tanks = 3.75 -> 4 tanks
    expect(res.structuresRequired).toBe(4);
    expect(res.estimatedCostNPR).toBe(4 * STRUCTURES.DETENTION_TANK.unitCostNPR);
  });

  it('adapts tight plots outside the clay zone to under-parking shafts', () => {
    const res = runSimulation(base({ permeableYardPercent: 5 }));

    expect(res.structureType).toBe('PARKING_SHAFT');
    expect(res.engineeringRecommendation).toContain('Under-Parking');
    expect(res.structureCapacityLiters).toBe(942);
    // 4,500 / 942 = 4.78 -> 5 shafts
    expect(res.structuresRequired).toBe(5);
  });

  it('treats exactly 15% yard as NOT a tight plot', () => {
    expect(runSimulation(base({ permeableYardPercent: 15 })).isTightPlot).toBe(false);
    expect(runSimulation(base({ permeableYardPercent: 14.9 })).isTightPlot).toBe(true);
  });

  it('scales ward totals but keeps per-building score and payback', () => {
    const single = runSimulation(base({ permeableYardPercent: 20 }));
    const ward = runSimulation(base({ permeableYardPercent: 20, wardBuildingMultiplier: 500 }));

    expect(ward.cloudburstDivertedLiters).toBe(single.cloudburstDivertedLiters * 500);
    expect(ward.structuresRequired).toBe(single.structuresRequired * 500);
    expect(ward.estimatedCostNPR).toBe(single.estimatedCostNPR * 500);
    expect(ward.readinessScore).toBe(single.readinessScore);
    expect(ward.paybackYears).toBe(single.paybackYears);
    expect(ward.monthlyRunoffLiters).toHaveLength(12);
  });

  it('monthly breakdown sums to the annual total (within rounding)', () => {
    const res = runSimulation(base({ wardBuildingMultiplier: 100 }));
    const runoffSum = res.monthlyRunoffLiters.reduce((a, b) => a + b, 0);
    const rechargeSum = res.monthlyRechargeLiters.reduce((a, b) => a + b, 0);
    expect(Math.abs(runoffSum - res.annualRunoffLiters)).toBeLessThanOrEqual(12);
    expect(Math.abs(rechargeSum - res.annualRechargeLiters)).toBeLessThanOrEqual(12);
  });

  it('returns zeros and null payback for a zero roof area', () => {
    const res = runSimulation(base({ roofAreaSqM: 0 }));
    expect(res.annualRunoffLiters).toBe(0);
    expect(res.structuresRequired).toBe(0);
    expect(res.estimatedCostNPR).toBe(0);
    expect(res.readinessScore).toBe(0);
    expect(res.paybackYears).toBeNull();
  });

  it('computes a positive payback for a normal building', () => {
    const res = runSimulation(base());
    expect(res.paybackYears).not.toBeNull();
    expect(res.paybackYears!).toBeGreaterThan(0);
  });

  it('never produces NaN for garbage input', () => {
    const res = runSimulation(
      base({
        lat: Number.NaN,
        lng: Number.NaN,
        roofAreaSqM: Number.NaN,
        permeableYardPercent: -40,
        annualPropertyTaxNPR: -1,
        wardBuildingMultiplier: 0,
      })
    );
    expect(res.zoneId).toBe('OUTSIDE_VALLEY');
    for (const v of Object.values(res)) {
      if (typeof v === 'number') expect(Number.isNaN(v)).toBe(false);
    }
  });
});

describe('sanitizeInput', () => {
  it('clamps and defaults invalid values', () => {
    const s = sanitizeInput(
      base({
        roofAreaSqM: -10,
        permeableYardPercent: 250,
        annualPropertyTaxNPR: Number.NaN,
        wardBuildingMultiplier: 0,
        roofMaterial: 'MUD' as never,
      })
    );
    expect(s.roofAreaSqM).toBe(0);
    expect(s.permeableYardPercent).toBe(100);
    expect(s.annualPropertyTaxNPR).toBe(0);
    expect(s.wardBuildingMultiplier).toBe(1);
    expect(s.roofMaterial).toBe('RCC_CONCRETE');
  });
});

describe('getRebateTier', () => {
  it.each([
    [0, 0],
    [24, 0],
    [25, 5],
    [49, 5],
    [50, 10],
    [79, 10],
    [80, 15],
    [100, 15],
  ])('score %i -> %i%% rebate', (score, pct) => {
    expect(getRebateTier(score).rebatePercentage).toBe(pct);
  });
});
