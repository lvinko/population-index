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
 * Uses a proper logistic growth model that smoothly transitions
 * from exponential growth to carrying capacity limit
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

  // Standard logistic growth model: P(t) = K / (1 + ((K - P0) / P0) * exp(-r*t))
  // This ensures smooth, realistic growth that approaches K asymptotically
  const P0 = Math.max(1, basePopulation);
  const safeK = Math.max(P0 * 1.01, K); // Ensure K is always > P0
  
  // Handle case where population is near or above carrying capacity
  if (P0 >= safeK * 0.99) {
    // Population is at or near capacity - apply decay if rEff is negative, or minimal growth
    const decayFactor = rEff < 0 ? Math.exp(rEff * years) : 1 + rEff * years * 0.1;
    const predicted = P0 * decayFactor;
    
    // apply sentiment influence (global effect ±2%)
    const worldInfluence = 1 + sentiment * 0.02;
    const finalPredicted = predicted * worldInfluence;
    const uncertainty = finalPredicted * 0.03;

    return {
      predicted: Math.max(0, Math.round(finalPredicted)),
      lower: Math.max(0, Math.round(finalPredicted - uncertainty)),
      upper: Math.max(0, Math.round(finalPredicted + uncertainty)),
      adjustedRate: rEff,
      carryingCapacity: Math.round(safeK),
    };
  }

  // Standard logistic growth: P(t) = K / (1 + A * exp(-r*t))
  // where A = (K - P0) / P0
  const A = (safeK - P0) / P0;
  const denominator = 1 + A * Math.exp(-rEff * years);
  const predictedLogistic = safeK / denominator;

  // For short-term predictions (1-5 years), blend with exponential for more responsiveness
  // For long-term, use pure logistic to respect carrying capacity
  const blendFactor = years <= 5 ? Math.exp(-years / 10) : 0; // Exponential decay of exponential component
  const P_exp = basePopulation * Math.exp(rEff * years);
  const blended = predictedLogistic * (1 - blendFactor) + P_exp * blendFactor;

  // apply sentiment influence (global effect ±2%)
  const worldInfluence = 1 + sentiment * 0.02;
  const predicted = blended * worldInfluence;

  // add uncertainty band (±3%)
  const uncertainty = predicted * 0.03;

  return {
    predicted: Math.max(0, Math.round(predicted)),
    lower: Math.max(0, Math.round(predicted - uncertainty)),
    upper: Math.max(0, Math.round(predicted + uncertainty)),
    adjustedRate: rEff,
    carryingCapacity: Math.round(safeK),
  };
}

export function projectHybridSeries(
  basePopulation: number,
  baseRate: number,
  input: PredictionInput,
  globalFactors?: { gdpGrowth?: number; conflictIndex?: number; sentiment?: number }
): PopulationDataPoint[] {
  const series: PopulationDataPoint[] = [];
  
  // Use iterative approach: each year's prediction is based on the previous year's population
  // This ensures smooth transitions and realistic growth patterns
  let currentPopulation = basePopulation;

  for (let year = input.baseYear + 1; year <= input.targetYear; year += 1) {
    const stepInput: PredictionInput = { ...input, targetYear: year, baseYear: year - 1 };
    const prediction = predictPopulationAdvanced(currentPopulation, baseRate, stepInput, globalFactors);
    
    // Update current population for next iteration
    currentPopulation = prediction.predicted;
    
    series.push({
      year,
      value: prediction.predicted,
      lowerBound: prediction.lower,
      upperBound: prediction.upper,
    });
  }

  return series;
}

