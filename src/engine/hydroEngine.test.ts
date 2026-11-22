import { describe, expect, it } from 'vitest';
import { runSimulation } from './hydroEngine';

describe('Recharge-Ready KTM Hydrological Engine', () => {
  it('classifies Northern Alluvial zone with 1.0 infiltration multiplier', () => {
    const res = runSimulation({
      lat: 27.7785,
      lng: 85.3621,
      roofAreaSqM: 100,
      roofMaterial: 'RCC_CONCRETE',
      permeableYardPercent: 30,
      annualPropertyTaxNPR: 15000,
      wardBuildingMultiplier: 1,
    });

    expect(res.zoneId).toBe('NORTH_ALLUVIAL');
    expect(res.infiltrationMultiplier).toBe(1.0);
    // 100 * 1400 * 0.9 * 0.85 = 107,100 L
    expect(res.annualRunoffLiters).toBe(107100);
    expect(res.annualRechargeLiters).toBe(107100);
    // 100 * 50 * 0.9 = 4,500 L storm diversion -> ceil(4500 / 1130) = 4 pits
    expect(res.cloudburstDivertedLiters).toBe(4500);
    expect(res.pitsRequired).toBe(4);
  });

  it('adapts tight plots in Central Kalimati Clay to zero-footprint detention tanks', () => {
    const res = runSimulation({
      lat: 27.7032,
      lng: 85.3228,
      roofAreaSqM: 100,
      roofMaterial: 'RCC_CONCRETE',
      permeableYardPercent: 5,
      annualPropertyTaxNPR: 20000,
      wardBuildingMultiplier: 1,
    });

    expect(res.zoneId).toBe('CENTRAL_CLAY');
    expect(res.infiltrationMultiplier).toBe(0.45);
    expect(res.engineeringRecommendation).toContain('Zero-Footprint');
  });

  it('scales storm diversion and pits accurately with Ward Multiplier', () => {
    const single = runSimulation({
      lat: 27.7785,
      lng: 85.3621,
      roofAreaSqM: 100,
      roofMaterial: 'RCC_CONCRETE',
      permeableYardPercent: 20,
      annualPropertyTaxNPR: 15000,
      wardBuildingMultiplier: 1,
    });

    const ward = runSimulation({
      lat: 27.7785,
      lng: 85.3621,
      roofAreaSqM: 100,
      roofMaterial: 'RCC_CONCRETE',
      permeableYardPercent: 20,
      annualPropertyTaxNPR: 15000,
      wardBuildingMultiplier: 500,
    });

    expect(ward.cloudburstDivertedLiters).toBe(single.cloudburstDivertedLiters * 500);
    expect(ward.pitsRequired).toBe(single.pitsRequired * 500);
    expect(ward.monthlyRunoffLiters).toHaveLength(12);
  });
});