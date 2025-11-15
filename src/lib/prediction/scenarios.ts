import type { PredictionInput } from '@/lib/utils/types';

const STORAGE_KEY = 'population-index:scenarios';

export interface SavedScenario {
  id: string;
  name: string;
  input: PredictionInput;
  createdAt: string;
  updatedAt: string;
}

type ScenarioPayload = SavedScenario[];

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

function readRaw(): ScenarioPayload {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ScenarioPayload;
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

function writeRaw(payload: ScenarioPayload) {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadScenarios(): ScenarioPayload {
  return readRaw();
}

export function saveScenarioConfig(name: string, input: PredictionInput, scenarioId?: string): ScenarioPayload {
  const now = new Date().toISOString();
  const current = readRaw();
  const trimmedName = name.trim();
  if (!trimmedName) {
    return current;
  }

  if (scenarioId) {
    const updated = current.map((scenario) =>
      scenario.id === scenarioId
        ? { ...scenario, name: trimmedName, input, updatedAt: now }
        : scenario
    );
    writeRaw(updated);
    return updated;
  }

  const existing = current.find((scenario) => scenario.name.toLowerCase() === trimmedName.toLowerCase());
  if (existing) {
    const updated = current.map((scenario) =>
      scenario.id === existing.id
        ? { ...scenario, name: trimmedName, input, updatedAt: now }
        : scenario
    );
    writeRaw(updated);
    return updated;
  }

  const payload: SavedScenario = {
    id: generateId(),
    name: trimmedName,
    input,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [...current, payload];
  writeRaw(updated);
  return updated;
}

export function deleteScenarioConfig(id: string): ScenarioPayload {
  const current = readRaw();
  const filtered = current.filter((scenario) => scenario.id !== id);
  writeRaw(filtered);
  return filtered;
}

