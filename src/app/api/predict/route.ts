import { NextResponse } from 'next/server';
import { z } from 'zod';

import { fetchExternalFactors } from '@/lib/api/fetchExternalFactors';
import { fetchUkrainePopulation } from '@/lib/api/fetchCountryData';
import { predictPopulationAdvanced, projectHybridSeries } from '@/lib/utils/formula';
import { projectPopulationWithDynamics } from '@/lib/prediction/formula';
import {
  PopulationDataPoint,
  PredictionInput,
  PredictionResult,
  SwingInputs,
} from '@/lib/utils/types';
import { calculateRegionalForecast } from '@/lib/forecast/regionalDistribution';

const DEFAULT_SWING_INPUTS: SwingInputs = {
  geopoliticalIndex: 0.1,
  economicCyclePosition: 0.4,
  internationalSupport: 0.5,
  volatility: 0.3,
  shockEvents: [],
};

const shockEventSchema = z.object({
  year: z.number().int().min(1900).max(2300),
  severity: z.number().min(-1).max(1),
  recoveryYears: z.number().int().min(1).max(30),
});

const swingInputsSchema = z.object({
  geopoliticalIndex: z.number().min(-1).max(1),
  economicCyclePosition: z.number().min(0).max(1),
  internationalSupport: z.number().min(0).max(1),
  volatility: z.number().min(0).max(1),
  shockEvents: z.array(shockEventSchema).optional(),
});

const predictionSchema = z.object({
  baseYear: z.number().int().min(1900).max(2100),
  targetYear: z.number().int().min(1901).max(2200),
  birthRateChange: z.number().finite(),
  deathRateChange: z.number().finite(),
  migrationChange: z.number().finite(),
  economicSituation: z.enum(['weak', 'stable', 'growing']),
  conflictIntensity: z.enum(['peace', 'tension', 'war']),
  familySupport: z.enum(['low', 'medium', 'strong']),
  swingInputs: swingInputsSchema.optional(),
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

function resolveSwingInputs(
  inputs?: SwingInputs,
  conflictIntensity?: 'peace' | 'tension' | 'war'
): SwingInputs {
  const base = inputs ? { ...inputs } : { ...DEFAULT_SWING_INPUTS };

  // Auto-map conflict intensity to geopolitical index if not explicitly set
  // This ensures worst-case scenarios (war) have strong negative impact
  if (conflictIntensity && inputs?.geopoliticalIndex === undefined) {
    switch (conflictIntensity) {
      case 'war':
        base.geopoliticalIndex = -0.9; // Strong negative for war
        break;
      case 'tension':
        base.geopoliticalIndex = -0.3; // Moderate negative for tension
        break;
      case 'peace':
        base.geopoliticalIndex = 0.5; // Positive for peace
        break;
    }
  }

  return {
    geopoliticalIndex: base.geopoliticalIndex ?? DEFAULT_SWING_INPUTS.geopoliticalIndex,
    economicCyclePosition:
      base.economicCyclePosition ?? DEFAULT_SWING_INPUTS.economicCyclePosition,
    internationalSupport: base.internationalSupport ?? DEFAULT_SWING_INPUTS.internationalSupport,
    volatility: base.volatility ?? DEFAULT_SWING_INPUTS.volatility,
    shockEvents: base.shockEvents ?? DEFAULT_SWING_INPUTS.shockEvents,
  };
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

function mergeWithDynamicSeries(
  baseline: PopulationDataPoint[],
  dynamicSeries: PopulationDataPoint[]
): PopulationDataPoint[] {
  const dynamicMap = new Map(dynamicSeries.map((point) => [point.year, point]));
  const merged = baseline.map((point) => {
    const swingPoint = dynamicMap.get(point.year);
    if (!swingPoint) {
      return {
        ...point,
        baselineValue: point.baselineValue ?? point.value,
      };
    }

    return {
      ...point,
      value: swingPoint.value,
      swingValue: swingPoint.value,
      baselineValue: point.baselineValue ?? point.value,
      growthRate: swingPoint.growthRate,
      shockImpact: swingPoint.shockImpact,
      cyclePhase: swingPoint.cyclePhase,
      swingComponents: swingPoint.swingComponents,
      policyModifier: swingPoint.policyModifier,
    };
  });

  dynamicSeries.forEach((point) => {
    if (!merged.some((entry) => entry.year === point.year)) {
      merged.push({
        ...point,
        baselineValue: point.baselineValue ?? point.value,
      });
    }
  });

  return merged.sort((a, b) => a.year - b.year);
}

const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface SensitivityVariant {
  id: string;
  label: string;
  deltaLabel: string;
  apply: (inputs: SwingInputs) => SwingInputs;
}

const SENSITIVITY_VARIANTS: SensitivityVariant[] = [
  {
    id: 'geo_plus',
    label: 'Геополітичний індекс',
    deltaLabel: '+0.1',
    apply: (inputs) => ({
      ...inputs,
      geopoliticalIndex: clampValue(inputs.geopoliticalIndex + 0.1, -1, 1),
    }),
  },
  {
    id: 'geo_minus',
    label: 'Геополітичний індекс',
    deltaLabel: '-0.1',
    apply: (inputs) => ({
      ...inputs,
      geopoliticalIndex: clampValue(inputs.geopoliticalIndex - 0.1, -1, 1),
    }),
  },
  {
    id: 'support_plus',
    label: 'Міжнародна підтримка',
    deltaLabel: '+0.1',
    apply: (inputs) => ({
      ...inputs,
      internationalSupport: clampValue(inputs.internationalSupport + 0.1, 0, 1),
    }),
  },
  {
    id: 'support_minus',
    label: 'Міжнародна підтримка',
    deltaLabel: '-0.1',
    apply: (inputs) => ({
      ...inputs,
      internationalSupport: clampValue(inputs.internationalSupport - 0.1, 0, 1),
    }),
  },
  {
    id: 'volatility_plus',
    label: 'Волатильність',
    deltaLabel: '+0.1',
    apply: (inputs) => ({
      ...inputs,
      volatility: clampValue(inputs.volatility + 0.1, 0, 1),
    }),
  },
  {
    id: 'volatility_minus',
    label: 'Волатильність',
    deltaLabel: '-0.1',
    apply: (inputs) => ({
      ...inputs,
      volatility: clampValue(inputs.volatility - 0.1, 0, 1),
    }),
  },
  {
    id: 'cycle_shift',
    label: 'Фаза економічного циклу',
    deltaLabel: '+0.1 (зсув)',
    apply: (inputs) => ({
      ...inputs,
      economicCyclePosition: clampValue(inputs.economicCyclePosition + 0.1, 0, 1),
    }),
  },
];

function computeSensitivityResult(
  swingInputs: SwingInputs,
  runProjection: (inputs: SwingInputs) => ReturnType<typeof projectPopulationWithDynamics>,
  baselinePopulation: number,
  baselineVolatility: number
) {
  const variations = SENSITIVITY_VARIANTS.map((variant) => {
    const variantInputs = variant.apply({ ...swingInputs });
    const projection = runProjection(variantInputs);
    const latestPoint = projection.series[projection.series.length - 1];

    return {
      id: variant.id,
      label: variant.label,
      deltaLabel: variant.deltaLabel,
      predictedPopulation: latestPoint?.value ?? baselinePopulation,
      volatilityRange: projection.metadata.volatilityRange,
    };
  });

  return {
    baselinePopulation,
    baselineVolatility,
    variations,
  };
}

/**
 * GET endpoint to retrieve the latest available year from population data
 * This helps the frontend determine the default base year for predictions
 */
export async function GET() {
  try {
    const data = await fetchUkrainePopulation();

    if (!data.length) {
      return NextResponse.json(
        { error: 'Population data unavailable for Ukraine.' },
        { status: 503 }
      );
    }

    // Find the latest available year
    const latestYear = Math.max(...data.map((point) => point.year));
    const latestPoint = data.find((point) => point.year === latestYear);

    return NextResponse.json({
      latestYear,
      latestPopulation: latestPoint?.value ?? null,
      availableYears: data.map((point) => point.year).sort((a, b) => b - a), // Descending order
    });
  } catch (error) {
    console.error('Failed to fetch latest year', error);
    return NextResponse.json(
      { error: 'Unexpected error while fetching latest year.' },
      { status: 500 }
    );
  }
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

    const resolvedSwingInputs = resolveSwingInputs(input.swingInputs, input.conflictIntensity);
    
    // Auto-set high negative migration for war scenarios
    // War causes immediate mass migration/refugee flows, especially in first year
    let effectiveMigrationChange = input.migrationChange;
    if (input.conflictIntensity === 'war' && input.migrationChange === 0) {
      // Automatically set to -10% for war (massive outflow - worst case scenario)
      // This represents mass evacuation, refugee flows, and displacement
      // User can override by manually setting migration
      effectiveMigrationChange = -10;
    } else if (input.conflictIntensity === 'tension' && input.migrationChange === 0) {
      // Moderate migration outflow for tension
      effectiveMigrationChange = -3;
    }
    
    const baselineChart = buildChartData(
      data,
      basePoint,
      normalizedInput,
      globalFactors,
      baseGrowthRate
    );
    const dynamicProjection = projectPopulationWithDynamics(
      basePoint.value,
      baseGrowthRate,
      prediction.carryingCapacity,
      basePoint.year,
      input.targetYear,
      resolvedSwingInputs,
      globalFactors,
      {
        birthRateChange: input.birthRateChange,
        deathRateChange: input.deathRateChange,
        migrationChange: effectiveMigrationChange,
        conflictIntensity: input.conflictIntensity, // Pass conflict intensity for time-decay logic
      }
    );

    let chartData = mergeWithDynamicSeries(baselineChart, dynamicProjection.series);

    if (!chartData.some((point) => point.year === input.targetYear)) {
      const fallbackPoint =
        dynamicProjection.series.find((point) => point.year === input.targetYear) ??
        dynamicProjection.series[dynamicProjection.series.length - 1];
      if (fallbackPoint) {
        chartData.push({
          ...fallbackPoint,
          baselineValue: fallbackPoint.baselineValue ?? fallbackPoint.value,
        });
      }
    }

    const swingFinalPoint =
      dynamicProjection.series[dynamicProjection.series.length - 1];
    const finalPredicted = swingFinalPoint?.value ?? prediction.predicted;
    const finalAdjustedRate = swingFinalPoint?.growthRate ?? prediction.adjustedRate;
    const finalLowerBound = Math.max(0, Math.round(finalPredicted * 0.97));
    const finalUpperBound = Math.max(0, Math.round(finalPredicted * 1.03));

    const targetPoint = chartData.find((point) => point.year === input.targetYear);
    if (targetPoint) {
      targetPoint.lowerBound = finalLowerBound;
      targetPoint.upperBound = finalUpperBound;
    }

    const regionalForecast = calculateRegionalForecast(
      finalPredicted,
      input.targetYear,
      finalLowerBound,
      finalUpperBound,
      input.conflictIntensity
    );

    const runProjectionVariant = (variantInputs: SwingInputs) =>
      projectPopulationWithDynamics(
        basePoint.value,
        baseGrowthRate,
        prediction.carryingCapacity,
        basePoint.year,
        input.targetYear,
        variantInputs,
        globalFactors,
        {
          birthRateChange: input.birthRateChange,
          deathRateChange: input.deathRateChange,
          migrationChange: effectiveMigrationChange,
          conflictIntensity: input.conflictIntensity,
        }
      );

    const sensitivity = computeSensitivityResult(
      resolvedSwingInputs,
      runProjectionVariant,
      finalPredicted,
      dynamicProjection.metadata.volatilityRange
    );

    const response: PredictionResult = {
      predictedPopulation: finalPredicted,
      growthRate: baseGrowthRate,
      adjustedRate: finalAdjustedRate,
      message: `Скориговане за свінгом населення для ${input.targetYear}: ${finalPredicted.toLocaleString()} (±3%)`,
      carryingCapacity: prediction.carryingCapacity,
      lowerBound: finalLowerBound,
      upperBound: finalUpperBound,
      data: chartData.sort((a, b) => a.year - b.year),
      regions: regionalForecast,
      swingInputs: resolvedSwingInputs,
      swingMetadata: dynamicProjection.metadata,
      sensitivity,
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

