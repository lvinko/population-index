import type { PredictionInput } from '@/lib/utils/types';
import type { SavedScenario } from '@/lib/prediction/scenarios';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as limitQuery,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/dbClient';

const COLLECTION_NAME = 'predictionScenarios';
const MAX_RETURNED_SCENARIOS = 50;

type FirestoreScenario = {
  name: string;
  input: PredictionInput;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
};

const scenariosCollection = collection(db, COLLECTION_NAME);

const toIsoDate = (value?: Timestamp | string) => {
  if (!value) {
    return new Date().toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  return value.toDate().toISOString();
};

export async function fetchScenarioList(): Promise<SavedScenario[]> {
  const snapshots = await getDocs(
    query(scenariosCollection, orderBy('updatedAt', 'desc'), limitQuery(MAX_RETURNED_SCENARIOS))
  );

  return snapshots.docs.map((document) => {
    const data = document.data() as FirestoreScenario;
    return {
      id: document.id,
      name: data.name,
      input: data.input,
      createdAt: toIsoDate(data.createdAt),
      updatedAt: toIsoDate(data.updatedAt),
    };
  });
}

export async function createScenario(name: string, input: PredictionInput): Promise<string> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Scenario name is required.');
  }

  const docRef = await addDoc(scenariosCollection, {
    name: trimmedName,
    input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateScenario(id: string, name: string, input: PredictionInput): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Scenario name is required.');
  }

  const ref = doc(db, COLLECTION_NAME, id);
  await setDoc(
    ref,
    {
      name: trimmedName,
      input,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deleteScenario(id: string): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, id);
  await deleteDoc(ref);
}

