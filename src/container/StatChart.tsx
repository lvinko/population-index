'use client'

import { useState, useEffect, useMemo } from 'react';
import PopulationStackedChart from '@/components/PopulationStackedChart';
import { RegionData, PopulationData } from '@/types/population';
import { fetchCountryPopulation } from '@/queries/countriesNow';
import { useQuery } from '@tanstack/react-query';

const StatChart = () => {
  // Initialize state
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  // Use all available historical data (from 1960) for better visualization
  const [yearsRange,] = useState([1960, new Date().getFullYear()]);

  // Fetch country population data from countriesNow (data from 1960)
  const { data: countryData, isLoading: isLoadingCountry } = useQuery({
    queryKey: ["country-population", "UKR"],
    queryFn: () => fetchCountryPopulation("UKR"),
    staleTime: 1000 * 60 * 60 * 24,
  });

  useEffect(() => {
    // Set initial dimensions after component mounts
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setDimensions({
        width: isMobile ? 1200 : window.innerWidth - 100,
        height: window.innerHeight - 200,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Transform countriesNow data to match the expected PopulationData format
  // Simplified to show only country-level data (no regional breakdown)
  const transformedData: PopulationData = useMemo(() => {
    if (!countryData?.data?.populationCounts) return [];

    // Get all unique years from country data
    const years = new Set<number>();
    countryData.data.populationCounts.forEach(count => {
      const year = Number(count.year);
      if (!isNaN(year) && year >= yearsRange[0] && year <= yearsRange[1]) {
        years.add(year);
      }
    });

    // Convert to PopulationData format with country-level data only
    return Array.from(years)
      .sort((a, b) => a - b)
      .map(year => {
        const countryYearData = countryData.data.populationCounts.find(
          c => Number(c.year) === year && !c.sex
        );
        const totalValue = countryYearData?.value || 0;

        return {
          name: countryData.data.country,
          code: countryData.data.iso3,
          year,
          regions: [{
            name: countryData.data.country,
            label: countryData.data.country,
            code: countryData.data.iso3,
            dataset: {
              population: [
                {
                  year,
                  value: totalValue,
                  type: 'total',
                },
              ],
            },
          }],
        };
      });
  }, [countryData, yearsRange]);

  // Process the data for the stacked chart
  const processedData = useMemo(() => {
    return transformedData.flatMap(yearData =>
      yearData.regions.map(region => ({
        year: yearData.year.toString(),
        name: region.name,
        total: region.dataset.population.find(p => p.type === 'total')?.value || 0,
      }))
    ).filter(d => d.total > 0);
  }, [transformedData]);

  const isLoading = isLoadingCountry;

  if (isLoading) {
    return (
      <main className="flex-1 w-full p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Header Skeleton */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body p-4 sm:p-6">
              <div className="skeleton h-7 w-64 mb-2"></div>
              <div className="skeleton h-4 w-48"></div>
            </div>
          </div>

          {/* Chart Container Skeleton */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body p-4 sm:p-6">
              <div className="skeleton h-[600px] w-full"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="card bg-base-200 shadow-xl">
          <div tabIndex={0} className="collapse bg-base-100 border-base-300 border">
            <div className="collapse-title font-semibold">Як працює статистика?</div>
            <div className="collapse-content text-sm">
              Статистика розраховується на основі демографічних даних України та зовнішніх факторів, таких як війна, економічна ситуація, смертність, народжуваність, міграція тощо.
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body p-4 sm:p-6">
            <div className="w-full overflow-x-auto pb-4">
              <div className="min-w-[1200px]">
                <PopulationStackedChart
                  width={dimensions.width}
                  height={dimensions.height}
                  data={processedData as RegionData[]}
                  margin={{ top: 120, right: 40, bottom: 40, left: 80 }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default StatChart;
