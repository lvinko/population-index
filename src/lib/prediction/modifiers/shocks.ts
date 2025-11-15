import type { ShockEvent } from '@/lib/types/prediction';

export function applyShockModifier(
  population: number,
  currentYear: number,
  shocks: ShockEvent[]
): { population: number; impact: number } {
  let modifier = 0;

  for (const shock of shocks) {
    const distance = currentYear - shock.year;
    if (distance >= 0 && distance <= shock.recoveryYears) {
      const phase = distance / Math.max(1, shock.recoveryYears);
      const recoveryCurve = 1 - Math.exp(-5 * phase);
      modifier += shock.severity * (recoveryCurve * 0.04);
    }
  }

  const adjustedPopulation = population * (1 + modifier);

  return {
    population: adjustedPopulation,
    impact: modifier,
  };
}

