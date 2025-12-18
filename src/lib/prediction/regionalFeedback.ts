import { getRegionalCoefficient, totalRegionalCoefficient } from '@/data/regionalCoefficients';
import type { ShockEvent } from '@/lib/types/prediction';

export interface RegionalFeedback {
  migrationDrift: number;
  supportLift: number;
}

const RECOVERY_CURVE_RATE = 5;
const MIGRATION_DRIFT_MULTIPLIER = 0.0035;
const SUPPORT_LIFT_MULTIPLIER = 0.002;
const DEFAULT_REGIONAL_WEIGHT = 1;
const FALLBACK_REGIONAL_WEIGHT = 0.2;

function calculateRegionalWeight(regionsAffected?: string[]): number {
  if (!regionsAffected?.length) {
    return DEFAULT_REGIONAL_WEIGHT;
  }

  const total = regionsAffected.reduce((sum, region) => sum + getRegionalCoefficient(region), 0);
  return total > 0 ? total / totalRegionalCoefficient : FALLBACK_REGIONAL_WEIGHT;
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
    const recoveryCurve = 1 - Math.exp(-RECOVERY_CURVE_RATE * phase);
    const intensity = shock.severity * recoveryCurve;
    const regionalWeight = calculateRegionalWeight(shock.regionsAffected);

    migrationDrift += intensity * regionalWeight * MIGRATION_DRIFT_MULTIPLIER;

    if (intensity > 0) {
      supportLift += intensity * regionalWeight * SUPPORT_LIFT_MULTIPLIER;
    }
  }

  return { migrationDrift, supportLift };
}

