import { regionalCoefficients, totalRegionalCoefficient } from '@/data/regionalCoefficients';
import { applyGenderSplit } from './genderSplit';
import { RegionForecast } from '../utils/types';

/**
 * Calculate regional population forecast by distributing total population
 * across regions based on configurable coefficients, then applying gender splits
 */
export function calculateRegionalForecast(
  totalPopulation: number,
  year: number,
  lowerBound?: number,
  upperBound?: number
): RegionForecast[] {
  if (!regionalCoefficients.length || totalRegionalCoefficient === 0) {
    return [];
  }

  return regionalCoefficients.map(({ code, name, label, coefficient }) => {
    const regionPopulation = (totalPopulation * coefficient) / totalRegionalCoefficient;
    const genderSplit = applyGenderSplit(name, regionPopulation);
    const percent = Number(((coefficient / totalRegionalCoefficient) * 100).toFixed(2));

    const regionLowerBound = lowerBound
      ? Math.round((lowerBound * coefficient) / totalRegionalCoefficient)
      : Math.round(regionPopulation * 0.97);
    const regionUpperBound = upperBound
      ? Math.round((upperBound * coefficient) / totalRegionalCoefficient)
      : Math.round(regionPopulation * 1.03);

    return {
      code,
      region: name,
      label,
      population: Math.round(regionPopulation),
      male: genderSplit.male,
      female: genderSplit.female,
      percent,
      year,
      lowerBound: regionLowerBound,
      upperBound: regionUpperBound,
    };
  });
}

