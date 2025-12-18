import type { MacroIndicators, SwingComponentBreakdown, SwingInputs } from '@/lib/types/prediction';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// Swing factor multipliers
const GEOPOLITICAL_MULTIPLIER = 0.025;
const SUPPORT_BASE_MULTIPLIER = 0.004;
const SUPPORT_SENTIMENT_MULTIPLIER = 0.003;
const SENTIMENT_MULTIPLIER = 0.003;
const VOLATILITY_BASE = 0.01;
const CONFLICT_PENALTY_FACTOR = 0.6;
const CONFLICT_PENALTY_MIN = 0.25;
const CONFLICT_PENALTY_MAX = 1.0;
const SUPPORT_EFFECTIVENESS_WAR = 0.5;
const SUPPORT_EFFECTIVENESS_NORMAL = 1.0;
const WAR_THRESHOLD = -0.5;

export interface SwingFactorResult {
  value: number;
  components: SwingComponentBreakdown;
}

export function applySwingFactors(
  baseGrowthRate: number,
  yearOffset: number,
  inputs: SwingInputs,
  macro?: MacroIndicators
): SwingFactorResult {
  const { geopoliticalIndex, economicCyclePosition, internationalSupport, volatility } = inputs;
  const { gdpGrowth = 2, conflictIndex = 0.5, sentiment = 0 } = macro ?? {};

  const normalizedGdp = clamp(gdpGrowth / 5, -2, 2);
  const amplitude = VOLATILITY_BASE + Math.abs(normalizedGdp) * 0.004;
  const cyclePeriod = clamp(9.5 - sentiment * 2, 6.5, 11.5);
  const ecoCycle =
    Math.sin((2 * Math.PI * (yearOffset + economicCyclePosition * 100)) / cyclePeriod) * amplitude;

  const conflictPenalty = clamp(
    1 - conflictIndex * CONFLICT_PENALTY_FACTOR,
    CONFLICT_PENALTY_MIN,
    CONFLICT_PENALTY_MAX
  );
  const geoEffect = geopoliticalIndex * GEOPOLITICAL_MULTIPLIER * conflictPenalty;

  const supportEffectiveness =
    geopoliticalIndex < WAR_THRESHOLD ? SUPPORT_EFFECTIVENESS_WAR : SUPPORT_EFFECTIVENESS_NORMAL;
  const supportBoost =
    internationalSupport *
    (SUPPORT_BASE_MULTIPLIER + Math.max(sentiment, 0) * SUPPORT_SENTIMENT_MULTIPLIER) *
    supportEffectiveness;
  const sentimentTrend = sentiment * SENTIMENT_MULTIPLIER;

  const randomVolatility = (Math.random() - 0.5) * VOLATILITY_BASE * volatility * (1 + conflictIndex * 0.5);

  const regionalFeedbackPlaceholder = 0;

  const components: SwingComponentBreakdown = {
    base: baseGrowthRate,
    ecoCycle: ecoCycle * (1 + geopoliticalIndex * 0.4),
    geopolitical: geoEffect,
    support: supportBoost,
    sentiment: sentimentTrend,
    volatility: randomVolatility,
    regionalFeedback: regionalFeedbackPlaceholder,
  };

  const value =
    components.base +
    components.ecoCycle +
    components.geopolitical +
    components.support +
    components.sentiment +
    components.volatility;

  return { value, components };
}

