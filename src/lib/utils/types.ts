export interface PopulationDataPoint {
  year: number;
  value: number;
  lowerBound?: number;
  upperBound?: number;
}

export interface PredictionInput {
  baseYear: number;
  targetYear: number;
  birthRateChange: number;
  deathRateChange: number;
  migrationChange: number;
  economicSituation: 'weak' | 'stable' | 'growing';
  conflictIntensity: 'peace' | 'tension' | 'war';
  familySupport: 'low' | 'medium' | 'strong';
}

export interface RegionForecast {
  region: string;
  population: number;
  male: number;
  female: number;
  percent: number;
  year: number;
  lowerBound: number;
  upperBound: number;
}

export interface PredictionResult {
  predictedPopulation: number;
  growthRate: number;
  adjustedRate: number;
  message: string;
  carryingCapacity: number;
  lowerBound: number;
  upperBound: number;
  data: PopulationDataPoint[];
  regions?: RegionForecast[];
}

