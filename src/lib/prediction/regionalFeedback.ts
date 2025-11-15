import coefficients from '@/data/regionalCoefficients.json';
import type { ShockEvent } from '@/lib/types/prediction';

const totalCoeff = Object.values(coefficients).reduce((sum, value) => sum + value, 0);

export interface RegionalFeedback {
  migrationDrift: number;
  supportLift: number;
}

function calculateRegionalWeight(regionsAffected?: string[]): number {
  if (!regionsAffected || regionsAffected.length === 0) {
    return 1;
  }

  const total = regionsAffected.reduce((sum, region) => {
    const key = region as keyof typeof coefficients;
    return sum + (coefficients[key] ?? 0);
  }, 0);

  if (total === 0) {
    return 0.2;
  }

  return total / totalCoeff;
}

export function computeRegionalFeedback(shocks: ShockEvent[] | undefined, year: number): RegionalFeedback {
  if (!shocks?.length) {
    return { migrationDrift: 0, supportLift: 0 };
  }

  let migrationDrift = 0;
  let supportLift = 0;

  for (const shock of shocks) {
    const distance = year - shock.year;
    if (distance < 0 || distance > shock.recoveryYears) {
      continue;
    }

    const phase = distance / Math.max(1, shock.recoveryYears);
    const recoveryCurve = 1 - Math.exp(-5 * phase);
    const intensity = shock.severity * recoveryCurve;
    const regionalWeight = calculateRegionalWeight(shock.regionsAffected);

    migrationDrift += intensity * regionalWeight * 0.0035;

    if (intensity > 0) {
      supportLift += intensity * regionalWeight * 0.002;
    }
  }

  return { migrationDrift, supportLift };
}

