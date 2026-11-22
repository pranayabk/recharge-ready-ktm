import type { SimulationInput, SimulationResult } from '../types/simulator';

export interface SavedScenario {
  id: string;
  name: string;
  savedAt: string;
  input: SimulationInput;
  result: SimulationResult;
}

const STORAGE_KEY = 'recharge_ready_ktm_scenarios_v1';

export function loadSavedScenarios(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedScenario[]) : [];
  } catch {
    return [];
  }
}

export function saveScenario(
  name: string,
  input: SimulationInput,
  result: SimulationResult
): SavedScenario[] {
  const existing = loadSavedScenarios();
  const next: SavedScenario = {
    id: crypto.randomUUID(),
    name: name.trim() || `${result.zoneName} (${input.roofAreaSqM} m²)`,
    savedAt: new Date().toISOString(),
    input,
    result,
  };
  const updated = [next, ...existing].slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteScenario(id: string): SavedScenario[] {
  const updated = loadSavedScenarios().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}