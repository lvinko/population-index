'use client'

import { useState, useEffect, useMemo } from 'react';
import PopulationStackedChart from '@/components/PopulationStackedChart';
import { RegionData } from '@/types/population';
import { 
  fetchCountryPopulation, 
  fetchCountryCitiesPopulation,
  fetchCountryStates,
  fetchStateCities 
} from '@/queries/countriesNow';
import { useQuery, useQueries } from '@tanstack/react-query';
import { PopulationData } from '@/types/population';

const StatChart = () => {
  // Initialize state
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [yearsRange,] = useState([2003, 2022]);

  // Fetch country population data from countriesNow
  const { data: countryData, isLoading: isLoadingCountry } = useQuery({
    queryKey: ["country-population", "UKR"],
    queryFn: () => fetchCountryPopulation("UKR"),
    staleTime: 1000 * 60 * 60 * 24,
  });

  // Fetch states/oblasts for Ukraine
  const { data: statesData, isLoading: isLoadingStates } = useQuery({
    queryKey: ["ukraine-states"],
    queryFn: () => fetchCountryStates("Ukraine"),
    staleTime: 1000 * 60 * 60 * 24 * 7, // States don't change often
  });

  // Fetch cities population data from countriesNow for regional visualization
  const { data: citiesData, isLoading: isLoadingCities } = useQuery({
    queryKey: ["cities-population", "Ukraine"],
    queryFn: () => fetchCountryCitiesPopulation({ country: "Ukraine", limit: 1000 }),
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

  // Fetch cities for each state to create proper city-to-state mapping
  const stateCitiesQueries = useQueries({
    queries: statesData?.data?.states?.map(state => ({
      queryKey: ["state-cities", "Ukraine", state.name],
      queryFn: () => fetchStateCities("Ukraine", state.name),
      enabled: Boolean(statesData?.data?.states),
      staleTime: 1000 * 60 * 60 * 24 * 7, // State cities don't change often
    })) || [],
  });

  // Create a comprehensive city-to-state mapping from fetched state cities
  const cityToStateMap = useMemo(() => {
    const map = new Map<string, string>();
    
    if (!statesData?.data?.states) return map;

    // Build mapping from state cities queries
    stateCitiesQueries.forEach((query, index) => {
      const state = statesData.data.states[index];
      if (state && query.data?.data) {
        // Map each city in this state to the state name
        query.data.data.forEach(cityName => {
          if (cityName) {
            map.set(cityName.toLowerCase().trim(), state.name);
          }
        });
      }
    });

    // Add fallback static mappings for major cities (in case API doesn't return them)
    const cityToOblastMap: Record<string, string> = {
      'kyiv': 'Kyiv',
      'kiev': 'Kyiv',
      'kharkiv': 'Kharkiv Oblast',
      'odessa': 'Odessa Oblast',
      'odesa': 'Odessa Oblast',
      'dnipro': 'Dnipropetrovsk Oblast',
      'dnipropetrovsk': 'Dnipropetrovsk Oblast',
      'donetsk': 'Donetsk Oblast',
      'lviv': 'Lviv Oblast',
      'zaporizhzhia': 'Zaporizhzhya Oblast',
      'zaporizhzhya': 'Zaporizhzhya Oblast',
      'mykolaiv': 'Mykolaiv Oblast',
      'mykolayiv': 'Mykolaiv Oblast',
      'vinnytsia': 'Vinnytsia Oblast',
      'vinnytsya': 'Vinnytsia Oblast',
      'kryvyi rih': 'Dnipropetrovsk Oblast',
      'kryvyi rig': 'Dnipropetrovsk Oblast',
      'mariupol': 'Donetsk Oblast',
      'luhansk': 'Luhansk Oblast',
      'lugansk': 'Luhansk Oblast',
      'sevastopol': 'Autonomous Republic of Crimea',
      'simferopol': 'Autonomous Republic of Crimea',
      'kherson': 'Kherson Oblast',
      'poltava': 'Poltava Oblast',
      'chernihiv': 'Chernihiv Oblast',
      'chernigiv': 'Chernihiv Oblast',
      'cherkasy': 'Cherkasy Oblast',
      'sumy': 'Sumy Oblast',
      'zhytomyr': 'Zhytomyr Oblast',
      'khmelnytskyi': 'Khmelnytsky Oblast',
      'khmelnytsky': 'Khmelnytsky Oblast',
      'rivne': 'Rivne Oblast',
      'ternopil': 'Ternopil Oblast',
      'ivano-frankivsk': 'Ivano-Frankivsk Oblast',
      'lutsk': 'Volyn Oblast',
      'uzhhorod': 'Zakarpattia Oblast',
      'chernivtsi': 'Chernivtsi Oblast',
      'kropyvnytskyi': 'Kirovohrad Oblast',
      'kirovohrad': 'Kirovohrad Oblast',
    };

    // Add static mappings as fallback (only if not already in map)
    Object.entries(cityToOblastMap).forEach(([city, oblast]) => {
      const cityKey = city.toLowerCase().trim();
      if (!map.has(cityKey)) {
        map.set(cityKey, oblast);
      }
    });

    return map;
  }, [statesData, stateCitiesQueries]);

  // Aggregate cities by state/oblast using the mapping
  const regionsByState = useMemo(() => {
    if (!citiesData || !statesData?.data?.states) return new Map<string, Map<number, number>>();
    
    const statePopulations = new Map<string, Map<number, number>>();
    
    // Initialize all states
    statesData.data.states.forEach(state => {
      statePopulations.set(state.name, new Map<number, number>());
    });

    // Aggregate city populations by state using the mapping
    citiesData.forEach(city => {
      const cityKey = city.city.toLowerCase().trim();
      const matchedState = cityToStateMap.get(cityKey);
      
      // If no direct match, try partial matching with state names
      let stateMatch = matchedState;
      if (!stateMatch) {
        for (const state of statesData.data.states) {
          const stateNameLower = state.name.toLowerCase();
          // Check if city name contains state name (for cases like "Kyiv" matching "Kyiv")
          if (cityKey.includes(stateNameLower) || stateNameLower.includes(cityKey)) {
            stateMatch = state.name;
            break;
          }
        }
      }

      if (stateMatch && statePopulations.has(stateMatch)) {
        // Aggregate population by year for this state
        city.populationCounts.forEach(count => {
          const year = Number(count.year);
          if (!isNaN(year) && year >= yearsRange[0] && year <= yearsRange[1]) {
            const yearMap = statePopulations.get(stateMatch)!;
            const currentValue = yearMap.get(year) || 0;
            yearMap.set(year, currentValue + Number(count.value));
          }
        });
      }
    });

    return statePopulations;
  }, [citiesData, statesData, cityToStateMap, yearsRange]);

  // Transform countriesNow data to match the expected PopulationData format
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

    // Convert to PopulationData format with regional data
    return Array.from(years)
      .sort((a, b) => a - b)
      .map(year => {
        const countryYearData = countryData.data.populationCounts.find(
          c => Number(c.year) === year && !c.sex
        );
        const totalValue = countryYearData?.value || 0;
        
        // Build regions from aggregated state data
        const regions = Array.from(regionsByState.entries())
          .map(([stateName, yearMap]) => {
            const statePopulation = yearMap.get(year) || 0;
            return {
              name: stateName,
              label: stateName,
              code: stateName,
              dataset: {
                population: [
                  {
                    year,
                    value: statePopulation,
                    type: 'total',
                  },
                ],
              },
            };
          })
          .filter(region => region.dataset.population[0].value > 0)
          .sort((a, b) => b.dataset.population[0].value - a.dataset.population[0].value);

        return {
          name: countryData.data.country,
          code: countryData.data.iso3,
          year,
          regions: regions.length > 0 ? regions : [{
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
  }, [countryData, regionsByState, yearsRange]);

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

  const isLoadingStateCities = stateCitiesQueries.some(query => query.isLoading);
  const isLoading = isLoadingCountry || isLoadingStates || isLoadingCities || isLoadingStateCities;

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
          <div className="card-body p-4 sm:p-6">
            <h2 className="card-title text-lg sm:text-xl mb-1">
              Статистика населення України за {yearsRange[0]}-{yearsRange[1]}
            </h2>
            <p className="text-sm text-base-content/70">
              Візуалізація демографічних даних по регіонах
            </p>
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
