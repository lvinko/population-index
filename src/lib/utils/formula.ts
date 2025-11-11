import { PopulationDataPoint, PredictionInput } from './types';

type AdvancedPrediction = {
  predicted: number;
  lower: number;
  upper: number;
  adjustedRate: number;
  carryingCapacity: number;
};

/**
 * Complex hybrid population prediction model:
 * - Combines exponential & logistic growth
 * - Adjusts for economic, conflict, and global sentiment effects
 * - Nonlinear response using tanh/log/exponential weighting
 */

const WEIGHTS = {
  birth: 0.002,
  death: 0.002,
  migration: 0.001,
  economic: 0.0003,
  conflict: 0.0015,
  support: 0.0008,
} as const;

// helper nonlinear functions
const tanh = (x: number) => Math.tanh(x / 10);
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const clamp = (x: number, min: number, max: number) => Math.min(Math.max(x, min), max);

/**
 * Compute dynamic carrying capacity (K)
 */
function computeCarryingCapacity(
  basePop: number,
  gdpGrowth: number,
  conflictLevel: number,
  support: number
): number {
  const baseK = basePop * 1.3; // assume max potential ~130% of base
  const econEffect = 1 + 0.05 * Math.log1p(gdpGrowth / 100);
  const conflictPenalty = Math.exp(conflictLevel * 0.1);
  const supportBoost = 1 + support * 0.05;
  const carryingCapacity = (baseK * econEffect * supportBoost) / conflictPenalty;
  return Math.max(carryingCapacity, basePop * 1.01);
}

/**
 * Effective growth rate (r_eff)
 */
export function effectiveRate(baseRate: number, input: PredictionInput): number {
  const econ =
    input.economicSituation === 'growing'
      ? 1
      : input.economicSituation === 'weak'
      ? -1
      : 0;

  const conflict =
    input.conflictIntensity === 'war'
      ? 1
      : input.conflictIntensity === 'tension'
      ? 0.5
      : -0.2;

  const support =
    input.familySupport === 'strong'
      ? 1
      : input.familySupport === 'medium'
      ? 0.4
      : 0;

  const rEff =
    baseRate +
    WEIGHTS.birth * tanh(input.birthRateChange) -
    WEIGHTS.death * tanh(input.deathRateChange) +
    WEIGHTS.migration * tanh(input.migrationChange) +
    WEIGHTS.economic * econ -
    WEIGHTS.conflict * conflict +
    WEIGHTS.support * support;

  return clamp(rEff, -0.02, 0.02); // ±2% yearly limit for realism
}

/**
 * Main hybrid population prediction
 */
export function predictPopulationAdvanced(
  basePopulation: number,
  baseRate: number,
  input: PredictionInput,
  globalFactors?: { gdpGrowth?: number; conflictIndex?: number; sentiment?: number }
): AdvancedPrediction {
  const years = Math.max(0, input.targetYear - input.baseYear);
  const rEff = effectiveRate(baseRate, input);

  const gdpGrowth = globalFactors?.gdpGrowth ?? 2;
  const conflictIdx = clamp(globalFactors?.conflictIndex ?? 0.5, 0, 1);
  const sentiment = clamp(globalFactors?.sentiment ?? 0, -1, 1);

  // compute carrying capacity
  const K = computeCarryingCapacity(basePopulation, gdpGrowth, conflictIdx, sentiment);

  // logistic + exponential hybrid model
  const gamma = 0.3; // shape parameter
  const P_exp = basePopulation * Math.exp(rEff * years);
  const logisticTerm = 1 - basePopulation / K;
  const safeLogistic = sigmoid(logisticTerm); // avoid negative/zero
  const P_log = P_exp * Math.pow(safeLogistic, -gamma);

  // apply sentiment influence (global effect ±2%)
  const worldInfluence = 1 + sentiment * 0.02;
  const predicted = P_log * worldInfluence;

  // add uncertainty band (±3%)
  const uncertainty = predicted * 0.03;

  return {
    predicted: Math.max(0, Math.round(predicted)),
    lower: Math.max(0, Math.round(predicted - uncertainty)),
    upper: Math.max(0, Math.round(predicted + uncertainty)),
    adjustedRate: rEff,
    carryingCapacity: Math.round(K),
  };
}

export function projectHybridSeries(
  basePopulation: number,
  baseRate: number,
  input: PredictionInput,
  globalFactors?: { gdpGrowth?: number; conflictIndex?: number; sentiment?: number }
): PopulationDataPoint[] {
  const series: PopulationDataPoint[] = [];

  for (let year = input.baseYear + 1; year <= input.targetYear; year += 1) {
    const stepInput: PredictionInput = { ...input, targetYear: year };
    const prediction = predictPopulationAdvanced(basePopulation, baseRate, stepInput, globalFactors);
    series.push({
      year,
      value: prediction.predicted,
      lowerBound: prediction.lower,
      upperBound: prediction.upper,
    });
  }

  return series;
}

