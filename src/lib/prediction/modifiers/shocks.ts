import type { ShockEvent } from '@/lib/types/prediction';

const RECOVERY_CURVE_RATE = 5;
const NEGATIVE_SHOCK_MULTIPLIER = 0.15; // Up to 15% population loss
const POSITIVE_SHOCK_MULTIPLIER = 0.10; // Up to 10% population gain

export function applyShockModifier(
  population: number,
  currentYear: number,
  shocks: ShockEvent[]
): { population: number; impact: number } {
  let modifier = 0;

  for (const shock of shocks) {
    const distance = currentYear - shock.year;
    if (distance < 0 || distance > shock.recoveryYears) {
      continue;
    }

    const phase = distance / Math.max(1, shock.recoveryYears);
    const recoveryCurve = 1 - Math.exp(-RECOVERY_CURVE_RATE * phase);
    const impactMultiplier = shock.severity < 0 ? NEGATIVE_SHOCK_MULTIPLIER : POSITIVE_SHOCK_MULTIPLIER;
    modifier += shock.severity * recoveryCurve * impactMultiplier;
  }

  return {
    population: Math.max(0, population * (1 + modifier)),
    impact: modifier,
  };
}

