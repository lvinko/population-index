import coefficients from '@/data/regionalCoefficients.json';
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
  // Calculate total coefficient to normalize percentages
  const totalCoeff = Object.values(coefficients).reduce((a, b) => a + b, 0);

  return Object.entries(coefficients).map(([region, coeff]) => {
    // Calculate region population based on coefficient
    const regionPopulation = (totalPopulation * coeff) / totalCoeff;
    
    // Apply gender split
    const genderSplit = applyGenderSplit(region, regionPopulation);
    
    // Calculate percent share
    const percent = Number(((coeff / totalCoeff) * 100).toFixed(2));
    
    // Calculate bounds if provided (±3% of region population)
    const regionLowerBound = lowerBound 
      ? Math.round((lowerBound * coeff) / totalCoeff)
      : Math.round(regionPopulation * 0.97);
    const regionUpperBound = upperBound
      ? Math.round((upperBound * coeff) / totalCoeff)
      : Math.round(regionPopulation * 1.03);

    return {
      region,
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

