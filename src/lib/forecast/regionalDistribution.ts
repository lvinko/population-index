import { regionalCoefficients, totalRegionalCoefficient } from '@/data/regionalCoefficients';
import { applyGenderSplit } from './genderSplit';
import { RegionForecast } from '../utils/types';

/**
 * Border regions near Russia that are significantly affected during war
 * These regions experience additional population reduction due to proximity to conflict
 */
const BORDER_REGIONS_NEAR_RUSSIA = new Set([
  'UA-63', // Kharkiv Oblast
  'UA-14', // Donetsk Oblast
  'UA-09', // Luhansk Oblast
  'UA-59', // Sumy Oblast
]);

/**
 * Check if a region code is a border region near Russia
 */
function isBorderRegionNearRussia(code: string): boolean {
  return BORDER_REGIONS_NEAR_RUSSIA.has(code);
}

/**
 * Calculate war impact multiplier for border regions
 * Border regions experience additional 20-40% population reduction during war
 */
function getWarImpactMultiplier(
  code: string,
  conflictIntensity?: 'peace' | 'tension' | 'war'
): number {
  if (conflictIntensity !== 'war') {
    return 1.0; // No additional impact for peace/tension
  }

  if (!isBorderRegionNearRussia(code)) {
    return 1.0; // Non-border regions use standard distribution
  }

  // Border regions near Russia: 30% additional population reduction during war
  // This represents evacuation, displacement, and direct conflict impact
  return 0.7; // 70% of normal population (30% reduction)
}

/**
 * Calculate regional population forecast by distributing total population
 * across regions based on configurable coefficients, then applying gender splits
 * and war-specific reductions for border regions
 */
export function calculateRegionalForecast(
  totalPopulation: number,
  year: number,
  lowerBound?: number,
  upperBound?: number,
  conflictIntensity?: 'peace' | 'tension' | 'war'
): RegionForecast[] {
  if (!regionalCoefficients.length || totalRegionalCoefficient === 0) {
    return [];
  }

  // First, calculate base distribution
  const baseDistributions = regionalCoefficients.map(({ code, name, label, coefficient }) => {
    const baseRegionPopulation = (totalPopulation * coefficient) / totalRegionalCoefficient;
    const warMultiplier = getWarImpactMultiplier(code, conflictIntensity);
    const adjustedPopulation = baseRegionPopulation * warMultiplier;
    
    return {
      code,
      name,
      label,
      coefficient,
      basePopulation: baseRegionPopulation,
      adjustedPopulation,
      warMultiplier,
    };
  });

  // If war is active, border regions lose population (evacuation, displacement, casualties)
  // This lost population is redistributed proportionally to non-border regions
  // (representing internal displacement to safer areas)
  const totalAdjusted = baseDistributions.reduce((sum, d) => sum + d.adjustedPopulation, 0);
  const totalLost = totalPopulation - totalAdjusted;
  
  // Redistribute lost population from border regions to non-border regions proportionally
  // This ensures the total still adds up to the predicted total population
  const nonBorderRegions = baseDistributions.filter((d) => !isBorderRegionNearRussia(d.code));
  const nonBorderTotalCoefficient = nonBorderRegions.reduce((sum, d) => sum + d.coefficient, 0);
  
  return baseDistributions.map(({ code, name, label, adjustedPopulation, warMultiplier, coefficient }) => {
    let finalPopulation = adjustedPopulation;
    
    // Redistribute lost population from border regions to non-border regions
    if (conflictIntensity === 'war' && totalLost > 0 && !isBorderRegionNearRussia(code)) {
      const redistributionShare = nonBorderTotalCoefficient > 0 
        ? (coefficient / nonBorderTotalCoefficient) * totalLost
        : 0;
      finalPopulation = adjustedPopulation + redistributionShare;
    }

    const genderSplit = applyGenderSplit(name, finalPopulation);
    const baseCoefficient = baseDistributions.find((d) => d.code === code)?.coefficient ?? 0;
    const percent = Number(((baseCoefficient / totalRegionalCoefficient) * 100).toFixed(2));

    // Adjust bounds based on war impact
    const baseLowerBound = lowerBound
      ? Math.round((lowerBound * baseCoefficient) / totalRegionalCoefficient) * warMultiplier
      : Math.round(finalPopulation * 0.97);
    const baseUpperBound = upperBound
      ? Math.round((upperBound * baseCoefficient) / totalRegionalCoefficient) * warMultiplier
      : Math.round(finalPopulation * 1.03);

    return {
      code,
      region: name,
      label,
      population: Math.round(finalPopulation),
      male: genderSplit.male,
      female: genderSplit.female,
      percent,
      year,
      lowerBound: Math.max(0, baseLowerBound),
      upperBound: Math.max(0, baseUpperBound),
    };
  });
}

