import type { MacroIndicators, SwingComponentBreakdown, SwingInputs } from '@/lib/types/prediction';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
  const amplitude = 0.01 + Math.abs(normalizedGdp) * 0.004;
  const cyclePeriod = clamp(9.5 - sentiment * 2, 6.5, 11.5);
  const ecoCycle =
    Math.sin((2 * Math.PI * (yearOffset + economicCyclePosition * 100)) / cyclePeriod) *
    amplitude;

  const conflictPenalty = clamp(1 - conflictIndex * 0.6, 0.25, 1);
  const geoEffect = geopoliticalIndex * 0.008 * conflictPenalty;

  const supportBoost = internationalSupport * (0.004 + Math.max(sentiment, 0) * 0.003);
  const sentimentTrend = sentiment * 0.003;

  const randomVolatility = (Math.random() - 0.5) * 0.01 * volatility * (1 + conflictIndex * 0.5);

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

