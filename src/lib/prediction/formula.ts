import type {
  PopulationDataPoint,
  SwingInputs,
  SwingMetadata,
  ShockImpactSummary,
  MacroIndicators,
  SwingComponentBreakdown,
  PolicyImpactSummary,
} from '@/lib/types/prediction';

import { applySwingFactors } from './modifiers/swingFactors';
import { applySupportSoftening } from './modifiers/support';
import { applyShockModifier } from './modifiers/shocks';
import { applyPolicyResponses } from './policyResponses';
import { computeRegionalFeedback } from './regionalFeedback';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function logisticStep(population: number, growthRate: number, carryingCapacity: number): number {
  const safeCarryingCapacity = Math.max(carryingCapacity, population * 1.01);
  const delta = growthRate * population * (1 - population / safeCarryingCapacity);
  const nextPopulation = population + delta;
  return Math.max(0, nextPopulation);
}

export interface DynamicProjection {
  series: PopulationDataPoint[];
  metadata: SwingMetadata;
}

export function projectPopulationWithDynamics(
  initialPopulation: number,
  baseGrowthRate: number,
  carryingCapacity: number,
  startYear: number,
  endYear: number,
  inputs: SwingInputs,
  macro: MacroIndicators = {}
): DynamicProjection {
  const series: PopulationDataPoint[] = [];
  const shockImpacts: ShockImpactSummary[] = [];
  const componentTotals: SwingComponentBreakdown = {
    base: 0,
    ecoCycle: 0,
    geopolitical: 0,
    support: 0,
    sentiment: 0,
    volatility: 0,
    regionalFeedback: 0,
  };
  const policyImpacts: PolicyImpactSummary[] = [];

  let currentPopulation = initialPopulation;
  let baselinePopulation = initialPopulation;
  let maxGrowthRate = Number.NEGATIVE_INFINITY;
  let minGrowthRate = Number.POSITIVE_INFINITY;
  const cycleDeviations: number[] = [];

  const cycleLengthYears = 9.5;
  const policyAdjustedShocks = applyPolicyResponses(inputs.shockEvents, inputs.internationalSupport);
  const effectiveShocks =
    policyAdjustedShocks.events.length > 0 ? policyAdjustedShocks.events : inputs.shockEvents ?? [];
  policyImpacts.push(...policyAdjustedShocks.policies);

  for (let year = startYear + 1; year <= endYear; year += 1) {
    const yearOffset = year - startYear;

    baselinePopulation = logisticStep(baselinePopulation, baseGrowthRate, carryingCapacity);

    const swingResult = applySwingFactors(baseGrowthRate, yearOffset, inputs, macro);
    let adjustedGrowth = swingResult.value;
    const components = { ...swingResult.components };

    const regionalFeedback = computeRegionalFeedback(effectiveShocks, year);
    adjustedGrowth += regionalFeedback.migrationDrift;
    components.regionalFeedback = regionalFeedback.migrationDrift;

    const supportLevel = clamp(
      inputs.internationalSupport + regionalFeedback.supportLift,
      0,
      1
    );
    adjustedGrowth = applySupportSoftening(adjustedGrowth, supportLevel);
    components.support = components.support + regionalFeedback.supportLift * 0.002;

    componentTotals.base += components.base;
    componentTotals.ecoCycle += components.ecoCycle;
    componentTotals.geopolitical += components.geopolitical;
    componentTotals.support += components.support;
    componentTotals.sentiment += components.sentiment;
    componentTotals.volatility += components.volatility;
    componentTotals.regionalFeedback += components.regionalFeedback;

    const steppedPopulation = logisticStep(currentPopulation, adjustedGrowth, carryingCapacity);

    let shockImpact = 0;
    let populationAfterShock = steppedPopulation;

    if (effectiveShocks.length) {
      const { population, impact } = applyShockModifier(
        steppedPopulation,
        year,
        effectiveShocks
      );
      populationAfterShock = population;
      shockImpact = impact;

      if (impact !== 0) {
        const severitySum =
          effectiveShocks
            ?.filter(
              (event) => year >= event.year && year <= event.year + event.recoveryYears
            )
            .reduce((sum, event) => sum + event.severity, 0) ?? 0;
        shockImpacts.push({
          year,
          percent: Number((impact * 100).toFixed(2)),
          severity: Number(severitySum.toFixed(2)),
        });
      }
    }

    currentPopulation = populationAfterShock;

    maxGrowthRate = Math.max(maxGrowthRate, adjustedGrowth);
    minGrowthRate = Math.min(minGrowthRate, adjustedGrowth);
    cycleDeviations.push(Math.abs(adjustedGrowth - baseGrowthRate));

    const normalizedCyclePhase =
      (((yearOffset % cycleLengthYears) + cycleLengthYears) % cycleLengthYears) / cycleLengthYears;
    const cyclePhase = (normalizedCyclePhase + inputs.economicCyclePosition) % 1;

    series.push({
      year,
      value: Math.round(currentPopulation),
      swingValue: Math.round(currentPopulation),
      baselineValue: Math.round(baselinePopulation),
      growthRate: adjustedGrowth,
      shockImpact,
      cyclePhase,
      swingComponents: components,
      policyModifier: supportLevel - inputs.internationalSupport,
    });
  }

  const averageCycleAmplitude =
    cycleDeviations.length > 0
      ? cycleDeviations.reduce((sum, diff) => sum + diff, 0) / cycleDeviations.length
      : 0;

  const steps = Math.max(1, series.length);

  const metadata: SwingMetadata = {
    maxAdjustedGrowth: maxGrowthRate,
    minAdjustedGrowth: minGrowthRate,
    volatilityRange:
      Number.isFinite(maxGrowthRate) && Number.isFinite(minGrowthRate)
        ? maxGrowthRate - minGrowthRate
        : 0,
    averageCycleAmplitude,
    supportSoftening: inputs.internationalSupport,
    shockImpacts,
    averageRegionalFeedback: componentTotals.regionalFeedback / steps,
    policyImpacts,
    componentAverages: {
      base: componentTotals.base / steps,
      ecoCycle: componentTotals.ecoCycle / steps,
      geopolitical: componentTotals.geopolitical / steps,
      support: componentTotals.support / steps,
      sentiment: componentTotals.sentiment / steps,
      volatility: componentTotals.volatility / steps,
      regionalFeedback: componentTotals.regionalFeedback / steps,
    },
  };

  return { series, metadata };
}

