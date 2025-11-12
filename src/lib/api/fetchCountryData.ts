import ky from 'ky';
import { PopulationDataPoint } from '../utils/types';

const FALLBACK_POPULATION: PopulationDataPoint[] = [
  { year: 2010, value: 45870700 },
  { year: 2011, value: 45750000 },
  { year: 2012, value: 45550000 },
  { year: 2013, value: 45400000 },
  { year: 2014, value: 45000000 },
  { year: 2015, value: 44400000 },
  { year: 2016, value: 42800000 },
  { year: 2017, value: 42400000 },
  { year: 2018, value: 42100000 },
  { year: 2019, value: 41900000 },
  { year: 2020, value: 41700000 },
  { year: 2021, value: 41500000 },
  { year: 2022, value: 41100000 },
  { year: 2023, value: 40800000 },
];

const countriesNowClient = ky.create({
  prefixUrl: 'https://countriesnow.space/api/v0.1',
  headers: {
    Accept: 'application/json',
  },
  timeout: 10000,
  retry: {
    limit: 2,
  },
});

export async function fetchUkrainePopulation(): Promise<PopulationDataPoint[]> {
  try {
    const data = await countriesNowClient
      .get('countries/population/q', {
        searchParams: {
          iso3: 'UKR',
        },
      })
      .json<{
        error: boolean;
        msg: string;
        data: {
          populationCounts: Array<{
            year: string;
            value: number;
            sex?: string;
          }>;
        };
      }>();

    if (data.error || !Array.isArray(data.data?.populationCounts) || data.data.populationCounts.length === 0) {
      return FALLBACK_POPULATION;
    }

    // Filter for total population only (exclude sex-separated data)
    // This ensures we use all available historical data from 1960 for better calculations
    return data.data.populationCounts
      .filter((entry) => !entry.sex) // Only total population, not separated by sex
      .map((entry) => ({
        year: Number(entry.year),
        value: Number(entry.value),
      }))
      .sort((a, b) => a.year - b.year); // Ensure data is sorted by year
  } catch (error) {
    console.error('Failed to fetch Ukraine population data. Falling back to local dataset.', error);
    return FALLBACK_POPULATION;
  }
}

