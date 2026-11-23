import type { SimulationInput, SimulationResult } from '../types/simulator';
import { runSimulation } from './hydroEngine';

export interface SavedScenario {
  id: string;
  name: string;
  savedAt: string; // ISO timestamp
  input: SimulationInput;
  /** Always recomputed from `input` on load, so it never goes stale when engine constants change. */
  result: SimulationResult;
}

/** What is actually persisted: inputs only. */
type StoredScenario = Omit<SavedScenario, 'result'>;

export const STORAGE_KEY = 'recharge_ready_ktm_scenarios_v1';
export const MAX_SAVED_SCENARIOS = 10;

function makeId(): string {
  // crypto.randomUUID is only available in secure contexts (https / localhost)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `scn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isStoredScenario(value: unknown): value is StoredScenario {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const input = v.input as Record<string, unknown> | undefined;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.savedAt === 'string' &&
    typeof input === 'object' &&
    input !== null &&
    typeof input.lat === 'number' &&
    typeof input.lng === 'number' &&
    typeof input.roofAreaSqM === 'number' &&
    typeof input.roofMaterial === 'string'
  );
}

function readStored(): StoredScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStoredScenario) : [];
  } catch {
    return [];
  }
}

/** Returns false when storage is unavailable (private mode, quota exceeded, blocked cookies). */
function writeStored(list: StoredScenario[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

const hydrate = (s: StoredScenario): SavedScenario => ({
  id: s.id,
  name: s.name,
  savedAt: s.savedAt,
  input: s.input,
  result: runSimulation(s.input),
});

export function loadSavedScenarios(): SavedScenario[] {
  return readStored().map(hydrate);
}

export function saveScenario(name: string, input: SimulationInput): SavedScenario[] {
  const existing = readStored();
  const zoneName = runSimulation(input).zoneName;
  const next: StoredScenario = {
    id: makeId(),
    name: name.trim() || `${zoneName} (${input.roofAreaSqM} m²)`,
    savedAt: new Date().toISOString(),
    input: { ...input },
  };
  const updated = [next, ...existing].slice(0, MAX_SAVED_SCENARIOS);
  // If the write fails we still return the in-memory list so the UI keeps working this session.
  writeStored(updated);
  return updated.map(hydrate);
}

export function deleteScenario(id: string): SavedScenario[] {
  const updated = readStored().filter((s) => s.id !== id);
  writeStored(updated);
  return updated.map(hydrate);
}
