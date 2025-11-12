import { NextResponse } from 'next/server';
import { z } from 'zod';

import { fetchExternalFactors } from '@/lib/api/fetchExternalFactors';
import { fetchUkrainePopulation } from '@/lib/api/fetchCountryData';
import { predictPopulationAdvanced, projectHybridSeries } from '@/lib/utils/formula';
import { PopulationDataPoint, PredictionInput, PredictionResult } from '@/lib/utils/types';

const predictionSchema = z.object({
  baseYear: z.number().int().min(1900).max(2100),
  targetYear: z.number().int().min(1901).max(2200),
  birthRateChange: z.number().finite(),
  deathRateChange: z.number().finite(),
  migrationChange: z.number().finite(),
  economicSituation: z.enum(['weak', 'stable', 'growing']),
  conflictIntensity: z.enum(['peace', 'tension', 'war']),
  familySupport: z.enum(['low', 'medium', 'strong']),
});

function selectBasePoint(data: PopulationDataPoint[], baseYear: number): PopulationDataPoint {
  const sorted = [...data].sort((a, b) => a.year - b.year);
  let candidate = sorted[0];

  for (const point of sorted) {
    if (point.year <= baseYear && point.year >= candidate.year) {
      candidate = point;
    }
  }

  return candidate;
}

function selectComparisonPoint(data: PopulationDataPoint[], base: PopulationDataPoint): PopulationDataPoint {
  const sorted = [...data].sort((a, b) => a.year - b.year);
  const laterPoint = sorted.find((point) => point.year > base.year);

  if (laterPoint) {
    return laterPoint;
  }

  if (sorted.length >= 2) {
    return sorted[sorted.length - 2];
  }

  return base;
}

/**
 * Calculate base growth rate using multiple historical data points for better accuracy.
 * Uses linear regression on log-transformed population values to get a more stable growth rate.
 * Now uses up to 30 years of historical data for more precise calculations.
 */
function calculateBaseGrowthRate(
  data: PopulationDataPoint[],
  baseYear: number,
  lookbackYears: number = 30
): number {
  const sorted = [...data].sort((a, b) => a.year - b.year);
  
  // Filter data points within the lookback period from base year
  // Use all available data if we have less than lookbackYears, but prioritize recent data
  const relevantData = sorted.filter(
    (point) => point.year <= baseYear && point.year >= baseYear - lookbackYears
  );

  // If we have enough data points, use linear regression on log values
  if (relevantData.length >= 3) {
    // Calculate growth rates for each period and average them
    const growthRates: number[] = [];
    for (let i = 1; i < relevantData.length; i++) {
      const prev = relevantData[i - 1];
      const curr = relevantData[i];
      const yearDiff = Math.max(1, curr.year - prev.year);
      const safePrev = Math.max(1, prev.value);
      const safeCurr = Math.max(1, curr.value);
      const rate = Math.log(safeCurr / safePrev) / yearDiff;
      if (Number.isFinite(rate)) {
        growthRates.push(rate);
      }
    }
    
    if (growthRates.length > 0) {
      // Use weighted average (more recent data has exponentially higher weight)
      // This gives recent trends more influence while still using long-term patterns
      const weights = growthRates.map((_, i) => Math.exp((i + 1) / growthRates.length));
      const weightedSum = growthRates.reduce((sum, rate, i) => sum + rate * weights[i], 0);
      const weightSum = weights.reduce((sum, w) => sum + w, 0);
      return weightedSum / weightSum;
    }
  }

  // Fallback to simple two-point calculation
  const basePoint = selectBasePoint(data, baseYear);
  const comparisonPoint = selectComparisonPoint(data, basePoint);
  const yearDiff = Math.max(1, comparisonPoint.year - basePoint.year);
  const safeBaseValue = Math.max(1, basePoint.value);
  const safeComparisonValue = Math.max(1, comparisonPoint.value);
  
  return Math.log(safeComparisonValue / safeBaseValue) / yearDiff;
}

function buildChartData(
  historical: PopulationDataPoint[],
  base: PopulationDataPoint,
  input: PredictionInput,
  globalFactors: { gdpGrowth?: number; conflictIndex?: number; sentiment?: number },
  baseGrowthRate: number
): PopulationDataPoint[] {
  const startYear = Math.max(base.year, input.baseYear);
  // Show all available historical data from 1960 for better context
  // This provides a complete picture of population trends over time
  const historicalStartYear = historical[0]?.year ?? startYear;

  const chartMap = new Map<number, PopulationDataPoint>();

  // Include all historical data from the earliest available year up to the base year
  historical
    .filter((point) => point.year >= historicalStartYear && point.year <= startYear)
    .forEach((point) => chartMap.set(point.year, { year: point.year, value: point.value }));

  const historicalYears = Array.from(chartMap.keys());
  const maxHistoricalYear = historicalYears.length ? Math.max(...historicalYears) : base.year;
  const projectedSeries = projectHybridSeries(base.value, baseGrowthRate, input, globalFactors);
  projectedSeries.forEach((point) => {
    if (point.year > maxHistoricalYear) {
      chartMap.set(point.year, {
        year: point.year,
        value: point.value,
        lowerBound: point.lowerBound,
        upperBound: point.upperBound,
      });
    }
  });

  return Array.from(chartMap.values()).sort((a, b) => a.year - b.year);
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const parsed = predictionSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input: PredictionInput = parsed.data;

    if (input.targetYear <= input.baseYear) {
      return NextResponse.json(
        { error: 'Target year must be greater than base year.' },
        { status: 400 }
      );
    }

    const data = await fetchUkrainePopulation();

    if (!data.length) {
      return NextResponse.json(
        { error: 'Population data unavailable for Ukraine.' },
        { status: 503 }
      );
    }

    const basePoint = selectBasePoint(data, input.baseYear);
    
    // Use improved growth rate calculation with multiple historical data points
    // This leverages the full dataset from 1960 for better accuracy
    // Using 30 years of lookback to capture long-term trends while weighting recent data more heavily
    const baseGrowthRate = calculateBaseGrowthRate(data, input.baseYear, 30);
    const normalizedInput: PredictionInput = { ...input, baseYear: basePoint.year };
    const globalFactors = await fetchExternalFactors();
    const prediction = predictPopulationAdvanced(
      basePoint.value,
      baseGrowthRate,
      normalizedInput,
      globalFactors
    );

    if (!Number.isFinite(prediction.predicted)) {
      return NextResponse.json(
        { error: 'Unable to calculate prediction with the provided data.' },
        { status: 422 }
      );
    }

    const chartData = buildChartData(data, basePoint, normalizedInput, globalFactors, baseGrowthRate);

    if (!chartData.some((point) => point.year === input.targetYear)) {
      chartData.push({
        year: input.targetYear,
        value: prediction.predicted,
        lowerBound: prediction.lower,
        upperBound: prediction.upper,
      });
    }

    const response: PredictionResult = {
      predictedPopulation: prediction.predicted,
      growthRate: baseGrowthRate,
      adjustedRate: prediction.adjustedRate,
      message: `Predicted population for ${input.targetYear}: ${prediction.predicted.toLocaleString()} (±3%)`,
      carryingCapacity: prediction.carryingCapacity,
      lowerBound: prediction.lower,
      upperBound: prediction.upper,
      data: chartData.sort((a, b) => a.year - b.year),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Prediction request failed', error);
    return NextResponse.json(
      { error: 'Unexpected error while processing prediction request.' },
      { status: 500 }
    );
  }
}

