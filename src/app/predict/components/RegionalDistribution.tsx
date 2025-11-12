'use client';

import { RegionForecast } from '@/lib/utils/types';

interface RegionalDistributionProps {
  regions: RegionForecast[];
  totalPopulation: number;
}

// Color palette for different regions
const REGION_COLORS = [
  'text-primary',
  'text-secondary',
  'text-accent',
  'text-info',
  'text-success',
  'text-warning',
  'text-error',
] as const;

export default function RegionalDistribution({ regions, totalPopulation }: RegionalDistributionProps) {
  if (!regions || regions.length === 0) {
    return null;
  }

  // Sort regions by population (descending) for better visualization
  const sortedRegions = [...regions].sort((a, b) => b.population - a.population);

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300">
      <div className="card-body p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-base-content mb-2">
            Регіональний розподіл населення
          </h3>
          <p className="text-sm text-base-content/70">
            Розподіл прогнозованого населення по регіонах України
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {sortedRegions.map((region, index) => {
            const colorIndex = index % REGION_COLORS.length;
            const colorClass = REGION_COLORS[colorIndex];

            return (
              <div key={region.region} className="stats stats-vertical shadow bg-base-200 border border-base-300">
                <div className="stat">
                  <div className="stat-title text-xs sm:text-sm">{region.region}</div>
                  <div className={`stat-value text-lg sm:text-xl ${colorClass}`}>
                    {region.population.toLocaleString()}
                  </div>
                  <div className="stat-desc text-xs">
                    {region.percent.toFixed(2)}% від загального
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-title text-xs sm:text-sm flex items-center gap-1.5">
                    <span className="text-blue-500">♂</span>
                    Чоловіки
                  </div>
                  <div className="stat-value text-base sm:text-lg text-blue-500">
                    {region.male.toLocaleString()}
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-title text-xs sm:text-sm flex items-center gap-1.5">
                    <span className="text-pink-500">♀</span>
                    Жінки
                  </div>
                  <div className="stat-value text-base sm:text-lg text-pink-500">
                    {region.female.toLocaleString()}
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-desc text-xs text-base-content/60">
                    Діапазон: {region.lowerBound.toLocaleString()} – {region.upperBound.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t border-base-300">
          <div className="flex flex-wrap justify-between items-center gap-4 text-sm">
            <div className="text-base-content/70">
              <span className="font-semibold">Всього регіонів:</span> {regions.length}
            </div>
            <div className="text-base-content/70">
              <span className="font-semibold">Загальне населення:</span>{' '}
              <span className="text-primary font-bold">{totalPopulation.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

