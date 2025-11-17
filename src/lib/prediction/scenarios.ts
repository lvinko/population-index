import ky from 'ky';
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

type ScenarioApiResponse = {
  data: ScenarioPayload;
};

const scenarioApi = ky.create({
  prefixUrl: '/api/scenarios',
  timeout: 10_000,
  retry: 0,
});

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

const persistAndReturn = (payload: ScenarioPayload) => {
  writeRaw(payload);
  return payload;
};

export async function loadScenarios(): Promise<ScenarioPayload> {
  try {
    const response = await scenarioApi.get('').json<ScenarioApiResponse>();
    return persistAndReturn(response.data);
  } catch (error) {
    console.warn('Falling back to local scenarios cache.', error);
    return readRaw();
  }
}

export async function saveScenarioConfig(
  name: string,
  input: PredictionInput,
  scenarioId?: string
): Promise<ScenarioPayload> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return readRaw();
  }

  try {
    const response = await scenarioApi
      .post('', {
        json: {
          id: scenarioId,
          name: trimmedName,
          input,
        },
      })
      .json<ScenarioApiResponse>();

    return persistAndReturn(response.data);
  } catch (error) {
    console.error('Failed to persist scenario remotely. Falling back to local storage.', error);
    const now = new Date().toISOString();
    const current = readRaw();

    if (scenarioId) {
      const updated = current.map((scenario) =>
        scenario.id === scenarioId
          ? { ...scenario, name: trimmedName, input, updatedAt: now }
          : scenario
      );
      return persistAndReturn(updated);
    }

    const existing = current.find(
      (scenario) => scenario.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      const updated = current.map((scenario) =>
        scenario.id === existing.id
          ? { ...scenario, name: trimmedName, input, updatedAt: now }
          : scenario
      );
      return persistAndReturn(updated);
    }

    const payload: SavedScenario = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmedName,
      input,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [...current, payload];
    return persistAndReturn(updated);
  }
}

export async function deleteScenarioConfig(id: string): Promise<ScenarioPayload> {
  if (!id) {
    return readRaw();
  }

  try {
    const response = await scenarioApi
      .delete('', {
        json: { id },
      })
      .json<ScenarioApiResponse>();

    return persistAndReturn(response.data);
  } catch (error) {
    console.error('Failed to delete scenario remotely. Falling back to local storage.', error);
    const current = readRaw();
    const filtered = current.filter((scenario) => scenario.id !== id);
    return persistAndReturn(filtered);
  }
}

