export function applySupportSoftening(adjustedRate: number, supportLevel: number): number {
  if (adjustedRate < 0) {
    return adjustedRate * (1 - supportLevel * 0.5);
  }
  return adjustedRate;
}

