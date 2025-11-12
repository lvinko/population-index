import ratios from '@/data/genderRatios.json';

interface GenderRatio {
  male: number;
  female: number;
}

interface GenderSplitResult {
  male: number;
  female: number;
}

/**
 * Apply gender split to a population based on region-specific or default ratios
 */
export function applyGenderSplit(region: string, population: number): GenderSplitResult {
  const regionKey = region as keyof typeof ratios;
  const ratio: GenderRatio = ratios[regionKey] || ratios.default;
  
  const male = Math.round(population * ratio.male);
  const female = Math.round(population * ratio.female);
  
  return { male, female };
}

