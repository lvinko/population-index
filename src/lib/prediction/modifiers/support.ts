const SEVERE_NEGATIVE_THRESHOLD = -0.01;
const SEVERE_MITIGATION_FACTOR = 0.3; // 30% mitigation for severe negative growth
const MODERATE_MITIGATION_FACTOR = 0.5; // 50% mitigation for moderate negative growth

export function applySupportSoftening(adjustedRate: number, supportLevel: number): number {
  if (adjustedRate < SEVERE_NEGATIVE_THRESHOLD) {
    return adjustedRate * (1 - supportLevel * SEVERE_MITIGATION_FACTOR);
  }
  if (adjustedRate < 0) {
    return adjustedRate * (1 - supportLevel * MODERATE_MITIGATION_FACTOR);
  }
  return adjustedRate;
}

