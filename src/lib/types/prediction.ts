export interface ShockEvent {
  year: number;
  severity: number; // -1 → +1
  recoveryYears: number;
  regionsAffected?: string[];
}

export interface SwingInputs {
  geopoliticalIndex: number;
  economicCyclePosition: number;
  internationalSupport: number;
  volatility: number;
  shockEvents?: ShockEvent[];
}

export interface MacroIndicators {
  gdpGrowth?: number;
  conflictIndex?: number;
  sentiment?: number;
}

export interface SwingComponentBreakdown {
  base: number;
  ecoCycle: number;
  geopolitical: number;
  support: number;
  sentiment: number;
  volatility: number;
  regionalFeedback: number;
}

export interface PopulationDataPoint {
  year: number;
  value: number;
  lowerBound?: number;
  upperBound?: number;
  baselineValue?: number;
  swingValue?: number;
  growthRate?: number;
  shockImpact?: number;
  cyclePhase?: number;
  swingComponents?: SwingComponentBreakdown;
  policyModifier?: number;
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
  swingInputs?: SwingInputs;
}

export interface RegionForecast {
  code: string;
  region: string;
  label?: string;
  population: number;
  male: number;
  female: number;
  percent: number;
  year: number;
  lowerBound: number;
  upperBound: number;
}

export interface ShockImpactSummary {
  year: number;
  percent: number;
  severity: number;
}

export interface PolicyImpactSummary {
  label: string;
  severityModifier: number;
  recoveryModifier: number;
}

export interface SwingMetadata {
  maxAdjustedGrowth: number;
  minAdjustedGrowth: number;
  volatilityRange: number;
  averageCycleAmplitude: number;
  supportSoftening: number;
  shockImpacts: ShockImpactSummary[];
  averageRegionalFeedback: number;
  policyImpacts: PolicyImpactSummary[];
  componentAverages: SwingComponentBreakdown;
}

export interface SensitivityPoint {
  id: string;
  label: string;
  deltaLabel: string;
  predictedPopulation: number;
  volatilityRange: number;
}

export interface SensitivityResult {
  baselinePopulation: number;
  baselineVolatility: number;
  variations: SensitivityPoint[];
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
  swingInputs?: SwingInputs;
  swingMetadata?: SwingMetadata;
  sensitivity?: SensitivityResult;
}

