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

function buildChartData(
  historical: PopulationDataPoint[],
  base: PopulationDataPoint,
  input: PredictionInput,
  globalFactors: { gdpGrowth?: number; conflictIndex?: number; sentiment?: number },
  baseGrowthRate: number
): PopulationDataPoint[] {
  const startYear = Math.max(base.year, input.baseYear);
  const historicalStartYear = Math.max(startYear - 5, historical[0]?.year ?? startYear);

  const chartMap = new Map<number, PopulationDataPoint>();

  historical
    .filter((point) => point.year >= historicalStartYear)
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
    const comparisonPoint = selectComparisonPoint(data, basePoint);

    const yearDiff = Math.max(1, comparisonPoint.year - basePoint.year);
    const safeBaseValue = Math.max(1, basePoint.value);
    const safeComparisonValue = Math.max(1, comparisonPoint.value);

    const baseGrowthRate = Math.log(safeComparisonValue / safeBaseValue) / yearDiff;
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

