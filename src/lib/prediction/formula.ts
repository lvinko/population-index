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

// Demographic rate multipliers
const BIRTH_RATE_MULTIPLIER = 0.002;
const DEATH_RATE_MULTIPLIER = 0.002;
const MIGRATION_MULTIPLIER_NORMAL = 0.001;
const MIGRATION_MULTIPLIER_TENSION = 0.002;
const MIGRATION_MULTIPLIER_WAR = 0.003;

// War impact constants
const WAR_DIRECT_IMPACT = -0.02; // -2% per year during war
const CYCLE_LENGTH_YEARS = 9.5;

// Migration decay factors for war scenarios
const WAR_MIGRATION_DECAY = {
  YEAR_1: 1.0,
  YEAR_2: 0.6,
  YEAR_3: 0.3,
  MIN: 0.1,
  DECAY_RATE: 0.5,
};

const TENSION_MIGRATION_DECAY = {
  YEAR_1: 1.0,
  MIN: 0.5,
  DECAY_RATE: 0.3,
};

function logisticStep(population: number, growthRate: number, carryingCapacity: number): number {
  const safeCarryingCapacity = Math.max(carryingCapacity, population * 1.01);
  const delta = growthRate * population * (1 - population / safeCarryingCapacity);
  return Math.max(0, population + delta);
}

/**
 * Calculate migration rate adjustment with time decay for conflict scenarios
 */
function calculateMigrationAdjustment(
  migrationChange: number,
  yearOffset: number,
  isWar: boolean,
  isTension: boolean
): number {
  if (migrationChange >= 0) {
    // Positive migration or no migration - no decay
    return migrationChange * MIGRATION_MULTIPLIER_NORMAL;
  }

  if (isWar) {
    // War: strong impact with exponential decay
    const decayFactor =
      yearOffset === 1
        ? WAR_MIGRATION_DECAY.YEAR_1
        : yearOffset === 2
        ? WAR_MIGRATION_DECAY.YEAR_2
        : yearOffset === 3
        ? WAR_MIGRATION_DECAY.YEAR_3
        : Math.max(WAR_MIGRATION_DECAY.MIN, Math.exp(-(yearOffset - 1) * WAR_MIGRATION_DECAY.DECAY_RATE));
    return migrationChange * decayFactor * MIGRATION_MULTIPLIER_WAR;
  }

  if (isTension) {
    // Tension: moderate impact with slower decay
    const decayFactor =
      yearOffset === 1
        ? TENSION_MIGRATION_DECAY.YEAR_1
        : Math.max(TENSION_MIGRATION_DECAY.MIN, Math.exp(-(yearOffset - 1) * TENSION_MIGRATION_DECAY.DECAY_RATE));
    return migrationChange * decayFactor * MIGRATION_MULTIPLIER_TENSION;
  }

  // Normal scenario: no decay
  return migrationChange * MIGRATION_MULTIPLIER_NORMAL;
}

export interface DynamicProjection {
  series: PopulationDataPoint[];
  metadata: SwingMetadata;
}

export interface DemographicRates {
  birthRateChange?: number;
  deathRateChange?: number;
  migrationChange?: number;
  conflictIntensity?: 'peace' | 'tension' | 'war';
}

export function projectPopulationWithDynamics(
  initialPopulation: number,
  baseGrowthRate: number,
  carryingCapacity: number,
  startYear: number,
  endYear: number,
  inputs: SwingInputs,
  macro: MacroIndicators = {},
  demographics: DemographicRates = {}
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

  const policyAdjustedShocks = applyPolicyResponses(inputs.shockEvents, inputs.internationalSupport);
  const effectiveShocks =
    policyAdjustedShocks.events.length > 0 ? policyAdjustedShocks.events : inputs.shockEvents ?? [];
  policyImpacts.push(...policyAdjustedShocks.policies);

  // Pre-calculate demographic adjustments
  const birthRateAdjustment = (demographics.birthRateChange ?? 0) * BIRTH_RATE_MULTIPLIER;
  const deathRateAdjustment = -(demographics.deathRateChange ?? 0) * DEATH_RATE_MULTIPLIER;
  const baseMigrationChange = demographics.migrationChange ?? 0;
  const isWarScenario = demographics.conflictIntensity === 'war';
  const isTensionScenario = demographics.conflictIntensity === 'tension';
  const warDirectImpact = isWarScenario ? WAR_DIRECT_IMPACT : 0;

  for (let year = startYear + 1; year <= endYear; year += 1) {
    const yearOffset = year - startYear;

    baselinePopulation = logisticStep(baselinePopulation, baseGrowthRate, carryingCapacity);

    const swingResult = applySwingFactors(baseGrowthRate, yearOffset, inputs, macro);
    let adjustedGrowth = swingResult.value;
    const components = { ...swingResult.components };

    // Calculate migration adjustment with time decay for conflict scenarios
    const migrationRateAdjustment = calculateMigrationAdjustment(
      baseMigrationChange,
      yearOffset,
      isWarScenario,
      isTensionScenario
    );

    // Combine all demographic adjustments
    const demographicAdjustment =
      birthRateAdjustment + deathRateAdjustment + migrationRateAdjustment + warDirectImpact;
    
    // Apply demographic rates directly - these have immediate year-over-year impact
    adjustedGrowth += demographicAdjustment;

    const regionalFeedback = computeRegionalFeedback(effectiveShocks, year);
    adjustedGrowth += regionalFeedback.migrationDrift;
    components.regionalFeedback = regionalFeedback.migrationDrift;

    const supportLevel = clamp(
      inputs.internationalSupport + regionalFeedback.supportLift,
      0,
      1
    );
    adjustedGrowth = applySupportSoftening(adjustedGrowth, supportLevel);
    components.support += regionalFeedback.supportLift * 0.002;

    // Accumulate component totals for metadata
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

      if (Math.abs(impact) > 0.0001) {
        const severitySum = effectiveShocks
          .filter((event) => year >= event.year && year <= event.year + event.recoveryYears)
          .reduce((sum, event) => sum + event.severity, 0);
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
      (((yearOffset % CYCLE_LENGTH_YEARS) + CYCLE_LENGTH_YEARS) % CYCLE_LENGTH_YEARS) / CYCLE_LENGTH_YEARS;
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

