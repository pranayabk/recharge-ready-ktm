import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SimulationInput } from '../types/simulator';
import {
  deleteScenario,
  loadSavedScenarios,
  MAX_SAVED_SCENARIOS,
  saveScenario,
  STORAGE_KEY,
} from './storage';

const input: SimulationInput = {
  lat: 27.7785,
  lng: 85.3621,
  roofAreaSqM: 120,
  roofMaterial: 'RCC_CONCRETE',
  permeableYardPercent: 30,
  annualPropertyTaxNPR: 15000,
  wardBuildingMultiplier: 1,
};

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
}

describe('scenario storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips a saved scenario and recomputes its result', () => {
    saveScenario('My house', input);
    const [loaded] = loadSavedScenarios();
    expect(loaded.name).toBe('My house');
    expect(loaded.input).toEqual(input);
    expect(loaded.result.zoneId).toBe('NORTH_ALLUVIAL');
    // only inputs are persisted
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain('"result"');
  });

  it('generates a default name when blank', () => {
    const [s] = saveScenario('   ', input);
    expect(s.name).toContain('120 m²');
  });

  it(`keeps at most ${MAX_SAVED_SCENARIOS} scenarios, newest first`, () => {
    for (let i = 0; i < MAX_SAVED_SCENARIOS + 3; i++) saveScenario(`s${i}`, input);
    const list = loadSavedScenarios();
    expect(list).toHaveLength(MAX_SAVED_SCENARIOS);
    expect(list[0].name).toBe(`s${MAX_SAVED_SCENARIOS + 2}`);
  });

  it('deletes by id', () => {
    const [a] = saveScenario('a', input);
    saveScenario('b', input);
    const after = deleteScenario(a.id);
    expect(after.map((s) => s.name)).toEqual(['b']);
  });

  it('ignores corrupt JSON and malformed entries', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadSavedScenarios()).toEqual([]);

    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 1 }, null, 'x']));
    expect(loadSavedScenarios()).toEqual([]);
  });

  it('does not throw when storage writes fail', () => {
    const broken = memoryStorage();
    broken.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    vi.stubGlobal('localStorage', broken);
    expect(() => saveScenario('x', input)).not.toThrow();
  });
});
